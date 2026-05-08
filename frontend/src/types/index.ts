export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId: string;
  createdAt: string;
}

export type JobStatus = 'SCHEDULED' | 'QUEUED' | 'SENT' | 'FAILED';

export interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: string;
  sentTime?: string;
  status: JobStatus;
  senderId: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkSchedulePayload {
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
}

export interface SingleSchedulePayload {
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
