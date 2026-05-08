import { Queue } from 'bullmq';
import redisConfig from '../config/redis';

export const emailQueue = new Queue('email-jobs', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  },
});

emailQueue.on('error', (err) => {
  console.error('Queue error:', err);
});

console.log('✅ BullMQ email queue initialized');

export default emailQueue;
