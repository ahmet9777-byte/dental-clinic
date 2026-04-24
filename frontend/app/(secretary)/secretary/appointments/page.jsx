'use client';
// هذه الصفحة تعيد توجيه السكرتير للـ dashboard الذي يحتوي على كل الحجوزات
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '../../../../components/ui';

export default function SecretaryAppointmentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/secretary/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" className="text-primary" />
    </div>
  );
}
