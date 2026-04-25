'use client';
import { useEffect, useState, useCallback } from 'react';
import { Spinner, EmptyState, StatusBadge, Button } from '../../../../components/ui';
import { conditionLabel } from '../../../../lib/constants';
import api from '../../../../lib/api';

function AppointmentCard({ appt, onComplete }) {
  const [completing, setCompleting] = useState(false);

  const date = new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.patch(`/appointments/${appt.id}/complete`);
      onComplete();
    } catch (e) {
      alert(e.response?.data?.message ?? 'Cannot complete this appointment.');
    } finally {
      setCompleting(false);
    }
  };

  const statusColors = {
    pending  : 'border-l-tertiary  bg-tertiary-container/10',
    confirmed: 'border-l-secondary bg-secondary-container/10',
    completed: 'border-l-outline   bg-surface-container-low',
    rejected : 'border-l-error     bg-error-container/10',
  };

  return (
    <div className={`card p-5 border-l-4 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cloud ${statusColors[appt.status] ?? ''}`}>
      {/* Date badge */}
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-outline uppercase">
          {new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleString('en', { month: 'short', timeZone: 'UTC' })}
        </span>
        <span className="text-xl font-black text-on-surface">
          {new Date(appt.appointmentDate + 'T00:00:00Z').getUTCDate()}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            #{String(appt.id).padStart(4, '0')}
          </span>
          <StatusBadge status={appt.status} />
        </div>
        <h4 className="font-bold text-on-surface">{conditionLabel(appt.condition)}</h4>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant flex-wrap">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-outline">person</span>
            {appt.patient?.name}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-outline">schedule</span>
            {appt.timeSlot}
          </span>
        </div>
        {appt.notes && (
          <p className="text-xs text-on-surface-variant italic">"{appt.notes}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <p className="text-xs text-outline whitespace-nowrap">{date}</p>
        {appt.status === 'confirmed' && (
          <Button variant="secondary" size="sm" loading={completing} onClick={handleComplete}>
            <span className="material-symbols-outlined text-sm">task_alt</span>
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctor/schedule');
      setAppointments(data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments.filter(a =>
    !filterStatus || a.status === filterStatus
  );

  const stats = {
    total    : appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending  : appointments.filter(a => a.status === 'pending').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            My Appointments
          </h2>
          <p className="text-on-surface-variant mt-1">All your upcoming and past appointments.</p>
        </div>
        <button onClick={load} className="text-sm text-outline hover:text-primary flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-sm">refresh</span> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: stats.total,     icon: 'event_note',      color: 'text-primary'   },
          { label: 'Confirmed', value: stats.confirmed, icon: 'check_circle',    color: 'text-secondary' },
          { label: 'Pending',   value: stats.pending,   icon: 'pending_actions', color: 'text-tertiary'  },
          { label: 'Completed', value: stats.completed, icon: 'task_alt',        color: 'text-outline'   },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-3">
            <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            <div>
              <p className="text-label-sm text-outline uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-on-surface">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '',          label: 'All' },
          { value: 'pending',   label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'completed', label: 'Completed' },
          { value: 'rejected',  label: 'Rejected' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              filterStatus === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="event_note"
          title="No appointments found"
          description={filterStatus ? 'No appointments with this status.' : 'Your schedule is clear.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered
            .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
            .map(appt => (
              <AppointmentCard key={appt.id} appt={appt} onComplete={load} />
            ))}
        </div>
      )}
    </div>
  );
}
