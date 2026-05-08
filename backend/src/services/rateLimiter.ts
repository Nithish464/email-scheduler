import { redis } from '../config/redis';
import dotenv from 'dotenv';
dotenv.config();

const MAX_EMAILS_PER_HOUR = parseInt(process.env.MAX_EMAILS_PER_HOUR || '200');
const MIN_DELAY_BETWEEN_EMAILS = parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS || '2000');

/**
 * Get the Redis key for hourly rate limiting per sender
 * Key format: ratelimit:{senderId}:{YYYY-MM-DDTHH}
 */
function getRateLimitKey(senderId: string): string {
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}`;
  return `ratelimit:${senderId}:${hourWindow}`;
}

/**
 * Check if sender can send right now (under hourly limit).
 * Returns { allowed: true } or { allowed: false, retryAfterMs: number }
 */
export async function checkRateLimit(senderId: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const key = getRateLimitKey(senderId);
  const current = await redis.incr(key);

  if (current === 1) {
    // First email this hour - set TTL of 2 hours for cleanup
    await redis.expire(key, 7200);
  }

  if (current > MAX_EMAILS_PER_HOUR) {
    // Decrement since we're not actually sending
    await redis.decr(key);

    // Calculate ms until next hour starts
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
    const retryAfterMs = nextHour.getTime() - now.getTime();

    return { allowed: false, retryAfterMs };
  }

  return { allowed: true };
}

/**
 * Get current hourly count for a sender
 */
export async function getHourlyCount(senderId: string): Promise<number> {
  const key = getRateLimitKey(senderId);
  const val = await redis.get(key);
  return val ? parseInt(val) : 0;
}

/**
 * Sleep for MIN_DELAY_BETWEEN_EMAILS to throttle sends
 */
export function getMinDelay(): number {
  return MIN_DELAY_BETWEEN_EMAILS;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
