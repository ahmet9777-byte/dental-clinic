'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/layout/Sidebar';
import { Spinner } from '../../components/ui';
import { PATIENT_NAV } from '../../lib/constants';

export default function PatientLayout({ children }) {
  const { isLoggedIn, isPatient, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isLoggedIn || !isPatient)) {
      router.replace('/login');
    }
  }, [isLoggedIn, isPatient, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isLoggedIn || !isPatient) return null;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar navItems={PATIENT_NAV} role="patient" />
      <main className="ml-64 flex-1 p-8 lg:p-12 min-h-screen">
        {children}
      </main>
    </div>
  );
}
