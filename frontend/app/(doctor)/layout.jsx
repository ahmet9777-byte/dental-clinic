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
      <main className="flex-1 lg:ml-64 pt-16 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
