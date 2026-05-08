'use client';
import { useSentEmails } from '../../hooks/useEmails';
import StatusBadge from '../StatusBadge';
import TableSkeleton from '../TableSkeleton';
import EmptyState from '../EmptyState';
import { formatDateTime, formatRelative } from '../../utils/dateUtils';

export default function SentEmailsTable() {
  const { jobs, loading, error, refresh } = useSentEmails();

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base" style={{ fontFamily: 'var(--font-syne)' }}>
            Sent Emails
          </h2>
          {!loading && (
            <p className="text-white/30 text-xs mt-0.5">{jobs.length} delivered</p>
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

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : jobs.length === 0 ? (
        <div className="glass rounded-2xl">
          <EmptyState
            title="No sent emails yet"
            description="Emails that have been successfully sent will appear here."
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_160px_90px] gap-4 px-4 py-2.5 border-b border-white/5 text-[11px] text-white/30 font-medium uppercase tracking-wider">
            <span>Recipient</span>
            <span>Subject</span>
            <span>Sent At</span>
            <span>Status</span>
          </div>

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
                {job.sentTime ? (
                  <>
                    <p className="text-white/60 text-[12px]">{formatDateTime(job.sentTime)}</p>
                    <p className="text-white/25 text-[11px]">{formatRelative(job.sentTime)}</p>
                  </>
                ) : (
                  <p className="text-white/25 text-[12px]">—</p>
                )}
              </div>
              <StatusBadge status={job.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
