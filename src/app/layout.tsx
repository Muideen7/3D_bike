import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SUPERBIKE GP 3D — Extreme Motorcycle Racing',
  description: 'High-octane 3D Grand Prix Motorcycle Racing Game built with Next.js, React Three Fiber, and Tailwind CSS.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full h-full bg-slate-950 text-white overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
