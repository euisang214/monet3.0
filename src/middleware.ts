import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: middleware } = NextAuth(authConfig);

// Apply auth middleware to all routes except Next.js internals and static assets.
// API routes are excluded here but must call `auth()` themselves for protection.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

