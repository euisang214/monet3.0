// Re-export NextAuth route handlers so the module builds correctly
export { handlers as GET, handlers as POST } from '@/auth';

// Ensure NextAuth handlers remain dynamic to avoid static optimization
export const dynamic = 'force-dynamic';