import { Suspense } from 'react';
import { AdminLoginForm } from './AdminLoginForm';

export const metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Suspense fallback={<p style={{ color: '#9aa0a6' }}>Loading…</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
