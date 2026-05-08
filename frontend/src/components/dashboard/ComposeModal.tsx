'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { scheduleEmail, scheduleBulk } from '../../services/emailService';
import { parseEmailsFromCSV, parseEmailsFromText } from '../../utils/csvParser';
import { toLocalDatetimeInput } from '../../utils/dateUtils';

interface ComposeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'single' | 'bulk';

export default function ComposeModal({ onClose, onSuccess }: ComposeModalProps) {
  const [mode, setMode] = useState<Mode>('single');
  const [loading, setLoading] = useState(false);

  // Single mode
  const [singleEmail, setSingleEmail] = useState('');

  // Bulk mode
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [parseInfo, setParseInfo] = useState<{ valid: number; invalid: number } | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [startTime, setStartTime] = useState(toLocalDatetimeInput(new Date(Date.now() + 5 * 60000)));
  const [delayBetween, setDelayBetween] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(200);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    try {
      const { valid, invalid } = await parseEmailsFromCSV(file);
      setBulkEmails(valid);
      setParseInfo({ valid: valid.length, invalid });
      toast.success(`Parsed ${valid.length} valid email${valid.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to parse file');
    }
  };

  const handleTextPaste = (text: string) => {
    const { valid, invalid } = parseEmailsFromText(text);
    setBulkEmails(valid);
    setParseInfo({ valid: valid.length, invalid });
  };

  const handleSubmit = async () => {
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!body.trim()) { toast.error('Email body is required'); return; }
    if (!startTime) { toast.error('Start time is required'); return; }

    if (mode === 'single') {
      if (!singleEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleEmail)) {
        toast.error('Enter a valid email address'); return;
      }
    } else {
      if (bulkEmails.length === 0) { toast.error('Upload or paste email addresses'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'single') {
        await scheduleEmail({
          recipientEmail: singleEmail.trim(),
          subject: subject.trim(),
          body: body.trim(),
          scheduledTime: new Date(startTime).toISOString(),
        });
        toast.success('Email scheduled!');
      } else {
        const result = await scheduleBulk({
          recipients: bulkEmails,
          subject: subject.trim(),
          body: body.trim(),
          startTime: new Date(startTime).toISOString(),
          delayBetweenEmails: delayBetween,
          hourlyLimit,
        });
        toast.success(`${result.count} emails scheduled!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl glass rounded-2xl shadow-2xl shadow-black/60 animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base" style={{ fontFamily: 'var(--font-syne)' }}>
              Compose Email
            </h2>
            <p className="text-white/30 text-xs mt-0.5">Schedule one or many emails</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Mode toggle */}
          <div className="flex bg-surface-3 rounded-xl p-1 gap-1">
            {(['single', 'bulk'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                  mode === m
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {m === 'single' ? 'Single Email' : 'Bulk (CSV)'}
              </button>
            ))}
          </div>

          {/* Recipients */}
          {mode === 'single' ? (
            <Field label="Recipient Email">
              <input
                type="email"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="input-base"
              />
            </Field>
          ) : (
            <Field label="Email Recipients">
              <div
                className="border-2 border-dashed border-white/10 hover:border-brand-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <svg className="w-8 h-8 text-white/20 group-hover:text-brand-400/50 mx-auto mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {csvFileName ? (
                  <p className="text-white/70 text-sm">{csvFileName}</p>
                ) : (
                  <p className="text-white/30 text-sm">Click to upload CSV or TXT</p>
                )}
                <p className="text-white/20 text-xs mt-1">One email per row, or comma-separated</p>
              </div>

              {/* Or paste */}
              <div className="mt-2">
                <p className="text-white/30 text-xs mb-1.5">Or paste emails:</p>
                <textarea
                  rows={3}
                  placeholder="a@x.com, b@x.com, c@x.com"
                  className="input-base resize-none text-xs"
                  onChange={(e) => handleTextPaste(e.target.value)}
                />
              </div>

              {parseInfo && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    ✓ {parseInfo.valid} valid
                  </span>
                  {parseInfo.invalid > 0 && (
                    <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      ⚠ {parseInfo.invalid} skipped
                    </span>
                  )}
                </div>
              )}
            </Field>
          )}

          {/* Subject */}
          <Field label="Subject">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your email subject"
              className="input-base"
            />
          </Field>

          {/* Body */}
          <Field label="Email Body">
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              className="input-base resize-none"
            />
          </Field>

          {/* Scheduling options */}
          <div className="bg-surface-3/50 rounded-xl p-4 space-y-4">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Scheduling Options</p>

            <Field label="Start Time">
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </Field>

            {mode === 'bulk' && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Delay Between Emails (ms)">
                  <input
                    type="number"
                    value={delayBetween}
                    onChange={(e) => setDelayBetween(Number(e.target.value))}
                    min={0}
                    step={500}
                    className="input-base"
                  />
                </Field>
                <Field label="Hourly Limit">
                  <input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                    min={1}
                    max={1000}
                    className="input-base"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/6 flex items-center justify-between flex-shrink-0 bg-surface-1/50">
          <p className="text-white/25 text-xs">
            {mode === 'bulk' && bulkEmails.length > 0
              ? `${bulkEmails.length} emails will be scheduled`
              : 'Fill in the details above'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all glow-brand"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: rgba(255,255,255,0.85);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .input-base:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
        }
        .input-base::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
