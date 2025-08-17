import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { BotIdProvider } from '@/components/providers/BotIdProvider';
import { SpeedInsightsProvider } from '@/components/providers/SpeedInsightsProvider';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@/components/ui/sonner';
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
        <ConvexClientProvider>
          <SpeedInsightsProvider>
            <BotIdProvider>
              {children}
              <Toaster />
              <Analytics />
            </BotIdProvider>
          </SpeedInsightsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
