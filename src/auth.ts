import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import LinkedIn from 'next-auth/providers/linkedin';
import bcrypt from 'bcryptjs';
import { prisma } from "@/lib/core/db";
import { z } from 'zod';
import { timezones } from '@/lib/utils/timezones';

declare module 'next-auth'{
  interface Session extends DefaultSession{
    user: { id: string; role: 'CANDIDATE'|'PROFESSIONAL' } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret',
  providers: [
    Credentials({
      async authorize(creds){
        const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
        const parsed = schema.safeParse(creds);
        if(!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if(!user || !user.hashedPassword) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.hashedPassword);
        if(!ok) return null;
        return { id: user.id, email: user.email, name: user.email.split('@')[0], role: user.role };
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: { params: { scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events', access_type: 'offline', prompt: 'consent' } }
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorization: { params: { scope: 'r_liteprofile r_emailaddress' } }
    })
  ],
  callbacks: {
    async signIn({ user, account, req }) {
      if (account && (account.provider === 'google' || account.provider === 'linkedin')) {
        if (!user.email) return false;
        const provider = account.provider;
        const tzParam = req?.nextUrl?.searchParams.get('timezone') || undefined;
        const timezone = tzParam && timezones.includes(tzParam) ? tzParam : (process.env.DEFAULT_TIMEZONE || 'UTC');
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              role: 'CANDIDATE',
              googleCalendarConnected: provider === 'google',
              linkedinConnected: provider === 'linkedin',
              timezone,
            }
          });
        } else {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              googleCalendarConnected: provider === 'google' ? true : dbUser.googleCalendarConnected,
              linkedinConnected: provider === 'linkedin' ? true : dbUser.linkedinConnected,
              ...(tzParam ? { timezone } : {}),
            }
          });
        }
        await prisma.oAuthAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId: account.providerAccountId
            }
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope
          },
          create: {
            userId: dbUser.id,
            provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope
          }
        });
        (user as any).id = dbUser.id;
        (user as any).role = dbUser.role;
      }
      return true;
    },
    async jwt({token, user}){
      if(user){
        token.role = (user as any).role || 'CANDIDATE';
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({session, token}){
      (session.user as any).id = token.uid as string;
      (session.user as any).role = (token.role as any) || 'CANDIDATE';
      return session;
    }
  }
});
