import type { Metadata } from 'next';
import { Syne, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: 'MailQueue — Email Scheduler',
  description: 'Production-grade email scheduling dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c28',
              color: '#e8e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#0a0a0f' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#0a0a0f' } },
          }}
        />
      </body>
    </html>
  );
}
