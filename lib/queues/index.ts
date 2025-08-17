import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../db';
import { qcAndGatePayout } from '../qc';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const queues = {
  notifications: new Queue('notifications', { connection }),
  qc: new Queue('qc', { connection }),
};

export function initWorkers(){
  new Worker('qc', async (job)=>{
    const { bookingId } = job.data as { bookingId: string };
    await qcAndGatePayout(bookingId);
  }, { connection });

  new Worker('notifications', async (job)=>{
    // simulate email
    await new Promise(r=>setTimeout(r, 50));
  }, { connection });
}

export async function enqueueFeedbackQC(bookingId: string){
  await queues.qc.add('qc', { bookingId }, { delay: 500 });
}

export async function enqueueNudges(bookingId: string){
  const delays = [24, 48, 72].map(h=>h*60*60*1000);
  for(const d of delays){
    await queues.notifications.add('nudge', { bookingId }, { delay: d });
  }
}
