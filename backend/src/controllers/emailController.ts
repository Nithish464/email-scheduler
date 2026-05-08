import { Request, Response } from 'express';
import {
  scheduleEmail,
  scheduleBulk,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
} from '../services/schedulerService';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export async function scheduleEmailHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as AuthUser;
    const { recipientEmail, subject, body, scheduledTime } = req.body;

    if (!recipientEmail || !subject || !body || !scheduledTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const job = await scheduleEmail({
      recipientEmail,
      subject,
      body,
      scheduledTime: new Date(scheduledTime),
      senderId: user.id,
    });

    res.status(201).json({ job });
  } catch (err: any) {
    console.error('scheduleEmail error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function scheduleBulkHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as AuthUser;
    const { recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: 'recipients must be a non-empty array' });
      return;
    }

    if (!subject || !body || !startTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const jobs = await scheduleBulk({
      recipients,
      subject,
      body,
      startTime: new Date(startTime),
      delayBetweenEmails: delayBetweenEmails || 2000,
      hourlyLimit: hourlyLimit || 200,
      senderId: user.id,
    });

    res.status(201).json({ jobs, count: jobs.length });
  } catch (err: any) {
    console.error('scheduleBulk error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getScheduledHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as AuthUser;
    const jobs = await getScheduledEmails(user.id);
    res.json({ jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSentHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as AuthUser;
    const jobs = await getSentEmails(user.id);
    res.json({ jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEmailByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as AuthUser;
    const { id } = req.params;
    const job = await getEmailById(id, user.id);

    if (!job) {
      res.status(404).json({ error: 'Email job not found' });
      return;
    }

    res.json({ job });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
