'use client';
import { useScheduledEmails } from '../../hooks/useEmails';
import StatusBadge from '../StatusBadge';
import TableSkeleton from '../TableSkeleton';
import EmptyState from '../EmptyState';
import { formatDateTime, formatRelative } from '../../utils/dateUtils';

export default function ScheduledEmailsTable() {
  const { jobs, loading, error, refresh } = useScheduledEmails();

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base" style={{ fontFamily: 'var(--font-syne)' }}>
            Scheduled Emails
          </h2>
          {!loading && (
            <p className="text-white/30 text-xs mt-0.5">{jobs.length} pending</p>
          )}
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : jobs.length === 0 ? (
        <div className="glass rounded-2xl">
          <EmptyState
            title="No scheduled emails"
            description="Emails you schedule will appear here. Click 'Compose' to get started."
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_160px_90px] gap-4 px-4 py-2.5 border-b border-white/5 text-[11px] text-white/30 font-medium uppercase tracking-wider">
            <span>Recipient</span>
            <span>Subject</span>
            <span>Scheduled</span>
            <span>Status</span>
          </div>

          {/* Data rows */}
          {jobs.map((job, i) => (
            <div
              key={job.id}
              className={`grid grid-cols-[1fr_1fr_160px_90px] gap-4 px-4 py-3 text-sm hover:bg-white/3 transition-colors ${
                i < jobs.length - 1 ? 'border-b border-white/4' : ''
              }`}
            >
              <span className="text-white/80 truncate font-mono text-[12px]">{job.recipientEmail}</span>
              <span className="text-white/60 truncate">{job.subject}</span>
              <div>
                <p className="text-white/60 text-[12px]">{formatDateTime(job.scheduledTime)}</p>
                <p className="text-white/25 text-[11px]">{formatRelative(job.scheduledTime)}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
