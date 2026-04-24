'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge, Spinner, EmptyState, Button } from '../../../components/ui';
import { conditionLabel } from '../../../lib/constants';
import api from '../../../lib/api';

function AppointmentCard({ appt, onCancel }) {
  const date = new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await api.delete(`/appointments/${appt.id}`);
      onCancel();
    } catch (e) {
      alert(e.response?.data?.message ?? 'Cannot cancel this appointment.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="card p-6 flex flex-col sm:flex-row gap-6 hover:-translate-y-0.5 hover:shadow-cloud-lg transition-all duration-200">
      {/* Date badge */}
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-outline uppercase">
          {new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleString('en', { month: 'short', timeZone: 'UTC' })}
        </span>
        <span className="text-2xl font-black text-on-surface">
          {new Date(appt.appointmentDate + 'T00:00:00Z').getUTCDate()}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            #{String(appt.id).padStart(4, '0')}
          </span>
          <StatusBadge status={appt.status} />
          {appt.emailSent && (
            <span className="flex items-center gap-1 text-label-sm text-secondary font-bold">
              <span className="material-symbols-outlined text-sm">mark_email_read</span>
              Email sent
            </span>
          )}
        </div>

        <h4 className="text-lg font-bold text-on-surface">{conditionLabel(appt.condition)}</h4>

        <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-outline">person</span>
            {appt.doctor?.user?.name ?? 'TBD'}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-outline">medical_services</span>
            {appt.doctor?.specialization}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-outline">schedule</span>
            {appt.timeSlot}
          </span>
        </div>

        {appt.notes && (
          <p className="text-sm text-on-surface-variant italic">"{appt.notes}"</p>
        )}

        {appt.rejectedReason && (
          <div className="flex items-start gap-2 p-3 bg-error-container/30 rounded-xl">
            <span className="material-symbols-outlined text-error text-sm mt-0.5">info</span>
            <p className="text-sm text-error">{appt.rejectedReason}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 justify-start flex-shrink-0">
        <p className="text-xs text-outline text-right whitespace-nowrap">{date}</p>
        {appt.status === 'pending' && (
          <Button
            variant="danger"
            size="sm"
            loading={cancelling}
            onClick={handleCancel}
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
            Cancel
          </Button>
        )}
        {appt.status === 'rejected' && (
          <Link href="/book">
            <Button variant="primary" size="sm" className="w-full">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Rebook
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyVisitsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [total,        setTotal]        = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/appointments/my?${params.toString()}`);
      setAppointments(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    all       : total,
    pending   : appointments.filter(a => a.status === 'pending').length,
    confirmed : appointments.filter(a => a.status === 'confirmed').length,
    completed : appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            My Visits
          </h2>
          <p className="text-on-surface-variant mt-1">All your appointment history.</p>
        </div>
        <Link href="/book">
          <Button variant="primary">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '',          label: 'All',       count: total },
          { value: 'pending',   label: 'Pending',   count: null },
          { value: 'confirmed', label: 'Confirmed',  count: null },
          { value: 'completed', label: 'Completed',  count: null },
          { value: 'rejected',  label: 'Rejected',   count: null },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilterStatus(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              filterStatus === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filterStatus === tab.value ? 'bg-white/20' : 'bg-surface-container'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="event_note"
          title="No appointments found"
          description={filterStatus ? 'No appointments with this status.' : 'Book your first appointment now.'}
          action={
            <Link href="/book">
              <Button variant="primary">Book Now</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {appointments.map(a => (
            <AppointmentCard key={a.id} appt={a} onCancel={load} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-outline">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="surface" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </Button>
            <Button variant="surface" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
