import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from './ClientProviders';

export const metadata: Metadata = {
  title: '말씀동역 - AI 설교 준비 도구',
  description: '목회자의 설교 준비를 돕는 AI 동역자',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="text-gray-900 antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
