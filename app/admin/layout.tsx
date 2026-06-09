import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stage Playlists Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        overflow: 'auto',
        background: '#0f1117',
        color: '#e8eaed',
      }}
    >
      {children}
    </div>
  );
}
