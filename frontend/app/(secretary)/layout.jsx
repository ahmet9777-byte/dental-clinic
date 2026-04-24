'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/layout/Sidebar';
import { Spinner } from '../../components/ui';
import { SECRETARY_NAV } from '../../lib/constants';

export default function SecretaryLayout({ children }) {
  const { isLoggedIn, isSecretary, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isSecretary)) {
      router.replace('/staff-login');
    }
  }, [isLoggedIn, isSecretary, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isLoggedIn || !isSecretary) return null;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar navItems={SECRETARY_NAV} role="secretary" />
      <main className="ml-64 flex-1 p-8 lg:p-12 min-h-screen max-w-[calc(100vw-16rem)]">
        {children}
      </main>
    </div>
  );
}
