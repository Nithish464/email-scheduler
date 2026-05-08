'use client';
import Image from 'next/image';
import { useState } from 'react';
import { User } from '../types';
import { logout } from '../services/authService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-white/5 bg-surface-1/80 backdrop-blur-xl flex items-center px-6 sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-auto">
        <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-white font-bold text-base tracking-tight" style={{ fontFamily: 'var(--font-syne)' }}>
          MailQueue
        </span>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 hover:bg-white/5 rounded-xl px-2.5 py-1.5 transition-colors"
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={28}
              height={28}
              className="rounded-full ring-1 ring-brand-500/30"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-300 text-xs font-bold">
              {user.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="text-left hidden sm:block">
            <p className="text-white text-xs font-medium leading-tight">{user.name}</p>
            <p className="text-white/40 text-[11px] leading-tight">{user.email}</p>
          </div>
          <svg className={`w-3.5 h-3.5 text-white/30 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-44 glass rounded-xl overflow-hidden z-50 animate-fade-in shadow-xl shadow-black/40">
              <div className="px-3 py-2.5 border-b border-white/5">
                <p className="text-white/60 text-[11px]">Signed in as</p>
                <p className="text-white text-xs font-medium truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
