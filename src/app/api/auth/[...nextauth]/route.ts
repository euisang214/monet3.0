// Re-export NextAuth route handlers so the module builds correctly
import { handlers } from '@/auth';

export const { GET, POST } = handlers;

// Ensure NextAuth handlers remain dynamic to avoid static optimization
export const dynamic = 'force-dynamic';