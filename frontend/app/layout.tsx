import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationCountProvider } from '@/lib/notification-count-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Kamu Radar — KPSS Kariyer Asistanı',
  description: 'KPSS puanınıza ve profilinize uygun kamu ilanlarını Kamu Radar sizin için takip eder.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <NotificationCountProvider>{children}</NotificationCountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
