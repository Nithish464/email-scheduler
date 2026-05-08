import api from './api';
import { EmailJob, BulkSchedulePayload, SingleSchedulePayload } from '../types';

export async function getScheduledEmails(): Promise<EmailJob[]> {
  const res = await api.get('/emails/scheduled');
  return res.data.jobs;
}

export async function getSentEmails(): Promise<EmailJob[]> {
  const res = await api.get('/emails/sent');
  return res.data.jobs;
}

export async function scheduleEmail(payload: SingleSchedulePayload): Promise<EmailJob> {
  const res = await api.post('/emails/schedule', payload);
  return res.data.job;
}

export async function scheduleBulk(payload: BulkSchedulePayload): Promise<{ jobs: EmailJob[]; count: number }> {
  const res = await api.post('/emails/schedule/bulk', payload);
  return res.data;
}
