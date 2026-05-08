import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

import redisConfig from '../config/redis';
import { prisma } from '../config/database';
import { sendEmail } from '../services/emailService';
import { checkRateLimit, sleep, getMinDelay } from '../services/rateLimiter';
import { emailQueue } from '../queues/emailQueue';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5');

interface EmailJobData {
  jobId: string;
  senderId: string;
}

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { jobId, senderId } = job.data;

  console.log(`⚙️  Processing job ${jobId} (Bull: ${job.id})`);

  // Fetch job from DB
  const emailJob = await prisma.emailJob.findUnique({ where: { id: jobId } });

  if (!emailJob) {
    console.warn(`⚠️  Job ${jobId} not found in DB, skipping`);
    return;
  }

  // Idempotency check: if already sent, skip
  if (emailJob.status === 'SENT') {
    console.log(`✅ Job ${jobId} already sent, skipping (idempotency)`);
    return;
  }

  // Check hourly rate limit (Redis-backed, safe across multiple workers)
  const rateCheck = await checkRateLimit(senderId);

  if (!rateCheck.allowed) {
    console.log(`⏳ Rate limit hit for sender ${senderId}. Rescheduling in ${rateCheck.retryAfterMs}ms`);

    // Reschedule into next hour - don't drop the job
    await emailQueue.add(
      'send-email',
      { jobId, senderId },
      {
        delay: rateCheck.retryAfterMs,
        jobId: `email-${jobId}-retry-${Date.now()}`,
      }
    );

    return; // Current job done (rescheduled version will run later)
  }

  try {
    // Throttle: minimum delay between sends
    await sleep(getMinDelay());

    // Send the email
    await sendEmail({
      to: emailJob.recipientEmail,
      subject: emailJob.subject,
      body: emailJob.body,
      from: `"Email Scheduler" <${senderId}@scheduler.com>`,
    });

    // Update DB status
    await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: 'SENT',
        sentTime: new Date(),
      },
    });

    console.log(`✅ Sent email to ${emailJob.recipientEmail} (job ${jobId})`);
  } catch (error) {
    console.error(`❌ Failed to send email for job ${jobId}:`, error);

    await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        retryCount: { increment: 1 },
      },
    });

    throw error; // Let BullMQ handle retry logic
  }
}

// Create worker
const worker = new Worker<EmailJobData>('email-jobs', processEmailJob, {
  connection: redisConfig,
  concurrency: WORKER_CONCURRENCY,
});

worker.on('completed', (job) => {
  console.log(`✅ Bull job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Bull job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log(`🚀 Email worker started (concurrency: ${WORKER_CONCURRENCY})`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

export default worker;
