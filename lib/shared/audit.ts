import { prisma } from '@/lib/core/db';

export async function logAudit(params: {
  actorUserId?: string|null, entity: string, entityId: string, action: string, metadata?: any
}){
  await prisma.auditLog.create({ data: {
    actorUserId: params.actorUserId || null,
    entity: params.entity,
    entityId: params.entityId,
    action: params.action,
    metadata: params.metadata || {},
  }});
}
