// Use a lightweight auth config that is compatible with the Edge runtime.
export { auth as middleware } from './auth-edge';

// Apply auth middleware to all routes except Next.js internals and static assets.
// API routes are excluded here but must call `auth()` themselves for protection.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

