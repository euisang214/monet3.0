export { GET, POST } from '@/auth';

// Ensure NextAuth handlers remain dynamic to avoid static optimization
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;