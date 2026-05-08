'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useScheduledEmails, useSentEmails } from '../../hooks/useEmails';
import Header from '../../components/Header';
import ScheduledEmailsTable from '../../components/dashboard/ScheduledEmailsTable';
import SentEmailsTable from '../../components/dashboard/SentEmailsTable';
import ComposeModal from '../../components/dashboard/ComposeModal';
import StatsBar from '../../components/dashboard/StatsBar';

type Tab = 'scheduled' | 'sent';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);

  const { jobs: scheduledJobs, loading: scheduledLoading, refresh: refreshScheduled } = useScheduledEmails();
  const { jobs: sentJobs, loading: sentLoading, refresh: refreshSent } = useSentEmails();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-white/30 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleComposeSuccess = () => {
    refreshScheduled();
    refreshSent();
  };

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Subtle background */}
      <div className="fixed inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      <Header user={user} />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Page title + compose button */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>
              Dashboard
            </h1>
            <p className="text-white/30 text-sm mt-0.5">
              Manage your email campaigns
            </p>
          </div>
          <button
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all glow-brand hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compose
          </button>
        </div>

        {/* Stats */}
        <StatsBar
          scheduled={scheduledJobs}
          sent={sentJobs}
          scheduledLoading={scheduledLoading}
          sentLoading={sentLoading}
        />

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/6 pb-0">
          {([
            { key: 'scheduled' as Tab, label: 'Scheduled', count: scheduledJobs.length, loading: scheduledLoading },
            { key: 'sent' as Tab, label: 'Sent', count: sentJobs.length, loading: sentLoading },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                tab === t.key
                  ? 'text-brand-400'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {t.label}
              {!t.loading && t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  tab === t.key
                    ? 'bg-brand-500/20 text-brand-300'
                    : 'bg-white/8 text-white/30'
                }`}>
                  {t.count}
                </span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {tab === 'scheduled' ? <ScheduledEmailsTable /> : <SentEmailsTable />}
        </div>
      </main>

      {/* Compose modal */}
      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSuccess={handleComposeSuccess}
        />
      )}
    </div>
  );
}
