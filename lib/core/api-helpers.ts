import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * Require authentication for an API route
 * Returns the session if authenticated, throws an error if not
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('unauthorized');
  }
  return session;
}

/**
 * Require specific role(s) for an API route
 * Returns the session if authorized, throws an error if not
 */
export async function requireRole(
  roles: ('ADMIN' | 'PROFESSIONAL' | 'CANDIDATE')[]
): Promise<Session> {
  const session = await requireAuth();

  // Check if user's role matches any of the required roles (Issue #7)
  if (roles.includes(session.user.role as any)) {
    return session;
  }

  throw new Error('forbidden');
}

/**
 * Wraps an API handler with authentication check
 * Returns 401 if not authenticated
 */
export function withAuth<T = any>(
  handler: (session: Session, req: Request, context?: T) => Promise<Response>
) {
  return async (req: Request, context?: T) => {
    try {
      const session = await requireAuth();
      return await handler(session, req, context);
    } catch (err: any) {
      if (err.message === 'unauthorized') {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      throw err;
    }
  };
}

/**
 * Wraps an API handler with role-based authorization check
 * Returns 401 if not authenticated, 403 if not authorized
 */
export function withRole<T = any>(
  roles: ('ADMIN' | 'PROFESSIONAL' | 'CANDIDATE')[],
  handler: (session: Session, req: Request, context?: T) => Promise<Response>
) {
  return async (req: Request, context?: T) => {
    try {
      const session = await requireRole(roles);
      return await handler(session, req, context);
    } catch (err: any) {
      if (err.message === 'unauthorized') {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      if (err.message === 'forbidden') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      throw err;
    }
  };
}
