import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { BotIdProvider } from '@/components/providers/BotIdProvider';
import { SpeedInsightsProvider } from '@/components/providers/SpeedInsightsProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Match Vibe',
  description: 'Analyze compatibility between X users with AI-driven vibe scoring',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SpeedInsightsProvider>
          <BotIdProvider>{children}</BotIdProvider>
        </SpeedInsightsProvider>
      </body>
    </html>
  );
}
