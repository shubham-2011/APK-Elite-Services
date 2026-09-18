import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'APK Elite Services | Lead Management CMS',
  description: 'Internal CMS viewer and lead tracker for APK Elite Services Pune',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
