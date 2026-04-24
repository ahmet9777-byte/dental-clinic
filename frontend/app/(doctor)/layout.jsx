'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/layout/Sidebar';
import { Spinner } from '../../components/ui';
import { DOCTOR_NAV } from '../../lib/constants';

export default function DoctorLayout({ children }) {
  const { isLoggedIn, isDoctor, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isDoctor)) {
      router.replace('/staff-login');
    }
  }, [isLoggedIn, isDoctor, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isLoggedIn || !isDoctor) return null;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar navItems={DOCTOR_NAV} role="doctor" />
      <main className="ml-64 flex-1 p-8 lg:p-12 min-h-screen">
        {children}
      </main>
    </div>
  );
}
