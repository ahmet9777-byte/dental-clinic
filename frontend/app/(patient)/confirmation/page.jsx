'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { conditionLabel } from '../../../lib/constants';
import { StatusBadge, Spinner, Button } from '../../../components/ui';
import api from '../../../lib/api';

export default function ConfirmationPage() {
  const params = useSearchParams();
  const id     = params.get('id');

  const [appt,    setAppt]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) { setError('No appointment ID provided.'); setLoading(false); return; }
    api.get(`/appointments/${id}`)
      .then(({ data }) => setAppt(data.data))
      .catch(() => setError('Could not load appointment details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <h2 className="text-2xl font-bold font-manrope">{error || 'Appointment not found.'}</h2>
        <Link href="/dashboard"><Button variant="primary">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const dateDisplay = new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

  return (
    <div className="max-w-2xl mx-auto animate-slide-up space-y-8">
      {/* Success hero */}
      <div className="card p-10 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-secondary-container/40 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl text-secondary">check_circle</span>
        </div>

        <div>
          <p className="text-label-sm font-bold text-secondary tracking-widest uppercase">
            Booking Received
          </p>
          <h1 className="text-3xl font-extrabold text-on-surface mt-2 font-manrope">
            Appointment Submitted!
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-sm mx-auto">
            Your request has been sent to our secretary for review. You will receive an email
            once it is confirmed.
          </p>
        </div>

        <StatusBadge status={appt.status} />
      </div>

      {/* Details card */}
      <div className="card p-8 space-y-5">
        <h2 className="font-bold text-on-surface text-lg font-manrope">Appointment Summary</h2>

        {[
          { icon: 'tag',             label: 'Reference',    value: `#${String(appt.id).padStart(4, '0')}` },
          { icon: 'dentistry',       label: 'Condition',    value: conditionLabel(appt.condition)           },
          { icon: 'person',          label: 'Doctor',       value: appt.doctor?.user?.name                  },
          { icon: 'medical_services',label: 'Specialization', value: appt.doctor?.specialization            },
          { icon: 'calendar_today',  label: 'Date',         value: dateDisplay                              },
          { icon: 'schedule',        label: 'Time',         value: appt.timeSlot                            },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-4 border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
            <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">{row.icon}</span>
            </div>
            <div>
              <p className="text-label-sm text-outline uppercase tracking-widest">{row.label}</p>
              <p className="font-bold text-on-surface text-sm">{row.value}</p>
            </div>
          </div>
        ))}

        {appt.notes && (
          <div className="pt-2">
            <p className="text-label-sm text-outline uppercase tracking-widest mb-1">Your Notes</p>
            <p className="text-sm text-on-surface-variant">{appt.notes}</p>
          </div>
        )}
      </div>

      {/* Email notice */}
      <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-3xl">
        <span className="material-symbols-outlined text-primary text-2xl mt-0.5">mark_email_read</span>
        <div>
          <p className="font-bold text-on-surface">Email Confirmation Pending</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Once our secretary approves your appointment, a detailed confirmation email will be
            sent automatically to your registered email address.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/dashboard" className="flex-1">
          <Button variant="primary" size="lg" className="w-full">
            <span className="material-symbols-outlined text-sm">dashboard</span>
            View My Appointments
          </Button>
        </Link>
        <Link href="/book" className="flex-1">
          <Button variant="surface" size="lg" className="w-full">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Book Another
          </Button>
        </Link>
      </div>
    </div>
  );
}
