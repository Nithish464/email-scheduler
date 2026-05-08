import { prisma } from '../config/database';
import { emailQueue } from '../queues/emailQueue';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleEmailInput {
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: Date;
  senderId: string;
  delayBetweenEmails?: number; // ms between this and prev email in bulk
}

export interface BulkScheduleInput {
  recipients: string[];
  subject: string;
  body: string;
  startTime: Date;
  delayBetweenEmails: number; // ms
  hourlyLimit: number;
  senderId: string;
}

export async function scheduleEmail(input: ScheduleEmailInput) {
  const now = Date.now();
  const scheduledMs = input.scheduledTime.getTime();
  const delay = Math.max(0, scheduledMs - now);

  // Create DB record first
  const job = await prisma.emailJob.create({
    data: {
      id: uuidv4(),
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      body: input.body,
      scheduledTime: input.scheduledTime,
      status: 'SCHEDULED',
      senderId: input.senderId,
    },
  });

  // Enqueue with delay - BullMQ handles persistence in Redis
  const bullJob = await emailQueue.add(
    'send-email',
    { jobId: job.id, senderId: input.senderId },
    {
      delay,
      jobId: `email-${job.id}`, // Idempotency: unique jobId prevents duplicates
    }
  );

  // Save bullJobId for tracking
  await prisma.emailJob.update({
    where: { id: job.id },
    data: { bullJobId: bullJob.id, status: 'QUEUED' },
  });

  return job;
}

export async function scheduleBulk(input: BulkScheduleInput) {
  const jobs = [];
  let currentTime = input.startTime.getTime();

  for (let i = 0; i < input.recipients.length; i++) {
    const recipientEmail = input.recipients[i];
    const scheduledTime = new Date(currentTime);

    const job = await scheduleEmail({
      recipientEmail,
      subject: input.subject,
      body: input.body,
      scheduledTime,
      senderId: input.senderId,
      delayBetweenEmails: input.delayBetweenEmails,
    });

    jobs.push(job);

    // Advance time: respect delay between emails
    currentTime += input.delayBetweenEmails;

    // If we've hit the hourly limit, jump to next hour boundary
    if ((i + 1) % input.hourlyLimit === 0) {
      const nextHour = new Date(currentTime);
      nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
      currentTime = nextHour.getTime();
    }
  }

  return jobs;
}

export async function getScheduledEmails(senderId: string) {
  return prisma.emailJob.findMany({
    where: { senderId, status: { in: ['SCHEDULED', 'QUEUED'] } },
    orderBy: { scheduledTime: 'asc' },
  });
}

export async function getSentEmails(senderId: string) {
  return prisma.emailJob.findMany({
    where: { senderId, status: { in: ['SENT', 'FAILED'] } },
    orderBy: { sentTime: 'desc' },
  });
}

export async function getEmailById(id: string, senderId: string) {
  return prisma.emailJob.findFirst({ where: { id, senderId } });
}

/**
 * On server startup: re-enqueue any SCHEDULED/QUEUED jobs that lost their BullMQ entry
 * This handles the case where Redis was wiped but DB still has jobs
 */
export async function recoverJobsOnStartup() {
  const pendingJobs = await prisma.emailJob.findMany({
    where: {
      status: { in: ['SCHEDULED', 'QUEUED'] },
      scheduledTime: { gt: new Date() },
    },
  });

  let recovered = 0;
  for (const job of pendingJobs) {
    const bullJobId = `email-${job.id}`;
    const existingBullJob = await emailQueue.getJob(bullJobId);

    if (!existingBullJob) {
      const delay = Math.max(0, job.scheduledTime.getTime() - Date.now());
      await emailQueue.add(
        'send-email',
        { jobId: job.id, senderId: job.senderId },
        { delay, jobId: bullJobId }
      );
      recovered++;
    }
  }

  if (recovered > 0) {
    console.log(`🔄 Recovered ${recovered} jobs on startup`);
  }
}
