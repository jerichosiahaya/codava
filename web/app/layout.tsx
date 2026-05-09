import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Codava', description: 'Strava for coders' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
