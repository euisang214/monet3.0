import NextAuth from 'next-auth';

// Minimal NextAuth configuration for Edge runtime
export const { auth } = NextAuth({
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret',
    // No providers are used in middleware auth, but an empty array is
  // required so NextAuth's env helper doesn't attempt to iterate over
  // `undefined`.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'CANDIDATE';
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.uid as string;
      (session.user as any).role = (token.role as any) || 'CANDIDATE';
      return session;
    },
  },
});
