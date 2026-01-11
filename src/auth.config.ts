import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/api/auth/signin', // Default NextAuth signin page or custom
    },
    callbacks: {
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.role = user.role || 'CANDIDATE';
                token.uid = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                session.user.id = token.uid as string;
                session.user.role = (token.role as any) || 'CANDIDATE';
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard =
                nextUrl.pathname.startsWith('/candidate') ||
                nextUrl.pathname.startsWith('/professional') ||
                nextUrl.pathname.startsWith('/admin');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true; // Allow other pages
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
