'use client';
import { useState, useEffect, useCallback } from 'react';
import { EmailJob } from '../types';
import { getScheduledEmails, getSentEmails } from '../services/emailService';

export function useScheduledEmails() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScheduledEmails();
      setJobs(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load scheduled emails');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [refresh]);

  return { jobs, loading, error, refresh };
}

export function useSentEmails() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSentEmails();
      setJobs(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load sent emails');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { jobs, loading, error, refresh };
}
