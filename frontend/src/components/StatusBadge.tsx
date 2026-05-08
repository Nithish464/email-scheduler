import { JobStatus } from '../types';

const configs: Record<JobStatus, { label: string; className: string; dot: string }> = {
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
  },
  QUEUED: {
    label: 'Queued',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400 animate-pulse',
  },
  SENT: {
    label: 'Sent',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
  },
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const c = configs[status] || configs.SCHEDULED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
