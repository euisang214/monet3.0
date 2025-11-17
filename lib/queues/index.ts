import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../db';
import { qcAndGatePayout } from '../qc';
import { sendEmail } from '../email';

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
    const { bookingId } = job.data as { bookingId: string };

    // Fetch booking with professional and feedback details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professional: true,
        feedback: true,
        candidate: true,
      },
    });

    if (!booking || !booking.professional) {
      console.error(`Nudge job: Booking ${bookingId} not found or missing professional`);
      return;
    }

    // Only send nudges if feedback needs revision
    if (booking.feedback?.qcStatus !== 'revise') {
      console.log(`Nudge job: Booking ${bookingId} feedback status is ${booking.feedback?.qcStatus}, skipping nudge`);
      return;
    }

    // Send nudge email to professional
    const feedbackUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/professional/feedback?bookingId=${bookingId}`;

    await sendEmail({
      from: process.env.SMTP_FROM || 'noreply@monet.com',
      to: booking.professional.email,
      subject: 'Reminder: Please revise your feedback',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Feedback Revision Needed</h2>
          <p>Hi ${booking.professional.firstName || 'there'},</p>
          <p>This is a reminder that your feedback for the call with ${booking.candidate?.firstName || 'your candidate'} needs revision to meet our quality standards.</p>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Quality Requirements:</h3>
            <ul>
              <li>Minimum 200 words in summary</li>
              <li>Exactly 3 specific action items</li>
              <li>All three star ratings (content, delivery, value)</li>
            </ul>
          </div>

          <p>Please revise your feedback as soon as possible to ensure timely payout.</p>

          <a href="${feedbackUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Revise Feedback
          </a>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact support.
          </p>
        </div>
      `,
    });

    console.log(`Nudge email sent to ${booking.professional.email} for booking ${bookingId}`);
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
