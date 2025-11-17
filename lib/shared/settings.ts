import { prisma } from '@/lib/core/db';

/**
 * Parse a full name into first and last name
 */
export function parseFullName(name: string): { firstName: string; lastName: string } {
  const [firstName, ...rest] = name.trim().split(' ');
  return {
    firstName: firstName || '',
    lastName: rest.join(' '),
  };
}

/**
 * Format first and last name into full name
 */
export function formatFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

/**
 * Delete a user account (shared logic for both candidate and professional)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
