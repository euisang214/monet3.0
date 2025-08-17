import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import LinkedIn from 'next-auth/providers/linkedin';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/db';
import { z } from 'zod';

declare module 'next-auth'{
  interface Session extends DefaultSession{
    user: { id: string; role: 'CANDIDATE'|'PROFESSIONAL' } & DefaultSession['user'];
  }
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
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
      authorization: { params: { scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events' } }
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorization: { params: { scope: 'r_liteprofile r_emailaddress' } }
    })
  ],
  callbacks: {
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
