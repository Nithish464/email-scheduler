'use client';
import { EmailJob } from '../../types';

interface StatsBarProps {
  scheduled: EmailJob[];
  sent: EmailJob[];
  scheduledLoading: boolean;
  sentLoading: boolean;
}

export default function StatsBar({ scheduled, sent, scheduledLoading, sentLoading }: StatsBarProps) {
  const failed = sent.filter((j) => j.status === 'FAILED').length;
  const successRate = sent.length > 0
    ? Math.round(((sent.length - failed) / sent.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Scheduled',
      value: scheduledLoading ? '—' : scheduled.length,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Sent',
      value: sentLoading ? '—' : sent.filter((j) => j.status === 'SENT').length,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Failed',
      value: sentLoading ? '—' : failed,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      label: 'Success Rate',
      value: sentLoading ? '—' : `${successRate}%`,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className={`glass rounded-xl px-4 py-3 ${s.bg} border border-white/5`}>
          <p className="text-white/35 text-[11px] uppercase tracking-wider font-medium">{s.label}</p>
          <p className={`text-2xl font-bold mt-0.5 ${s.color}`} style={{ fontFamily: 'var(--font-syne)' }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
