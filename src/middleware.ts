import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Default to a local secret so `getToken` doesn't error when no env var is set.
const secret =
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'local-dev-secret';

// Edge-friendly middleware that only decodes the NextAuth JWT.
export async function middleware(req: NextRequest) {
  await getToken({ req, secret });
  return NextResponse.next();
}

// Apply auth middleware to all routes except Next.js internals and static assets.
// API routes are excluded here but must call `auth()` themselves for protection.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

