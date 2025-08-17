import { auth } from '../../auth';

export type Role = 'CANDIDATE' | 'PROFESSIONAL' | 'ADMIN';

export async function getSession(){
  return await auth();
}

export async function requireRole(expected: Role[]){
  const session = await getSession();
  if(!session?.user) throw new Error('unauthorized');
  if(expected.includes('ADMIN')){
    // Admin test: seeded admin email address
    if(session.user.email === 'admin@monet.local') return session;
  }
  if(expected.includes(session.user.role as Role)) return session;
  throw new Error('forbidden');
}
