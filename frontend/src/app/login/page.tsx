'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { loginWithGoogle } from '../../services/authService';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (params.get('error') === 'auth_failed') {
      toast.error('Google login failed. Please try again.');
    }
  }, [params]);

  if (loading) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-surface-0 dot-grid flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-brand-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-4 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4 glow-brand">
            <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-sans text-3xl font-800 text-white tracking-tight" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800 }}>
            MailQueue
          </h1>
          <p className="text-white/40 text-sm mt-1.5">Production-grade email scheduling</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-white font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-syne)' }}>
            Sign in to continue
          </h2>
          <p className="text-white/40 text-xs mb-6">Schedule and manage emails at scale</p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/50 text-white rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 hover:glow-brand group"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
            <svg className="w-4 h-4 ml-auto text-white/30 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <p className="text-white/20 text-xs text-center mt-6">
            By signing in, you agree to our Terms of Service
          </p>
        </div>

        {/* Tech stack badge */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {['BullMQ', 'Redis', 'PostgreSQL'].map((t) => (
            <span key={t} className="text-[10px] font-mono text-white/20 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
}
