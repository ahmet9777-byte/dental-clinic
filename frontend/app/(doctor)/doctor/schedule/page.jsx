'use client';
import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../../../context/AuthContext';
import { StatusBadge, Spinner, EmptyState, Button } from '../../../../components/ui';
import { conditionLabel } from '../../../../lib/constants';
import api from '../../../../lib/api';

// ─── Patient detail panel ─────────────────────────────────────────────────
function PatientPanel({ appt, onClose, onComplete }) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.patch(`/appointments/${appt.id}/complete`);
      onComplete();
    } catch (e) { console.error(e); }
    finally { setCompleting(false); }
  };

  const date = new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(25,28,30,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-4xl p-6 w-full max-w-sm shadow-cloud-lg animate-slide-up space-y-5"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface font-manrope">Patient Details</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg">
            {appt.patient?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-on-surface">{appt.patient?.name}</p>
            <p className="text-sm text-outline">{appt.patient?.email}</p>
            {appt.patient?.phone && <p className="text-sm text-outline">{appt.patient?.phone}</p>}
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: 'calendar_today', label: 'Date',      value: date },
            { icon: 'schedule',       label: 'Time',      value: appt.timeSlot },
            { icon: 'dentistry',      label: 'Condition', value: conditionLabel(appt.condition) },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-lg">{row.icon}</span>
              <div>
                <p className="text-label-sm text-outline uppercase tracking-wider">{row.label}</p>
                <p className="font-semibold text-on-surface text-sm">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {appt.notes && (
          <div className="p-3 bg-surface-container-low rounded-2xl">
            <p className="text-label-sm text-outline uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-on-surface-variant">{appt.notes}</p>
          </div>
        )}

        <StatusBadge status={appt.status} />

        {appt.status === 'confirmed' && (
          <Button variant="secondary" className="w-full" loading={completing} onClick={handleComplete}>
            <span className="material-symbols-outlined text-sm">task_alt</span>
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Appointment card ─────────────────────────────────────────────────────
function AppointmentCard({ appt, onClick }) {
  const colors = {
    pending  : 'border-l-tertiary  bg-tertiary-container/10',
    confirmed: 'border-l-secondary bg-secondary-container/10',
    completed: 'border-l-outline   bg-surface-container-low',
  };

  return (
    <button onClick={onClick}
      className={clsx('w-full text-left p-4 rounded-3xl border border-outline-variant/10 border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cloud',
        colors[appt.status] ?? 'border-l-outline bg-surface-container-low')}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="font-bold text-on-surface text-sm">{appt.timeSlot}</span>
        <StatusBadge status={appt.status} />
      </div>
      <p className="font-bold text-on-surface">{appt.patient?.name}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{conditionLabel(appt.condition)}</p>
      <p className="text-xs text-outline mt-1 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">touch_app</span>
        Tap to view details
      </p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function DoctorSchedulePage() {
  const { user } = useAuth();

  const todayISO = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const load = useCallback(async (date) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doctor/schedule?date=${date}`);
      setAppointments(data.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(selectedDate); }, [selectedDate, load]);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayISO + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().split('T')[0];
  });

  const dateLabel = (iso) => {
    const d = new Date(iso + 'T00:00:00Z');
    return {
      day  : d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
      num  : d.getUTCDate(),
      full : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
    };
  };

  const stats = {
    total    : appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending  : appointments.filter(a => a.status === 'pending').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  const firstName = user?.name?.replace('Dr. ', '') ?? 'Doctor';

  return (
    <>
      {selectedAppt && (
        <PatientPanel
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onComplete={() => { setSelectedAppt(null); load(selectedDate); }}
        />
      )}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            Dr. {firstName}'s Schedule
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            {user?.name} · {user?.doctorProfile?.specialization ?? 'Specialist'}
          </p>
        </div>

        {/* Date selector strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {weekDates.map(iso => {
            const { day, num } = dateLabel(iso);
            const isToday  = iso === todayISO;
            const isActive = iso === selectedDate;
            return (
              <button key={iso} onClick={() => setSelectedDate(iso)}
                className={clsx('flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl transition-all duration-200 min-w-[52px] flex-shrink-0',
                  isActive ? 'bg-primary text-white shadow-lg'
                  : isToday ? 'bg-primary/10 text-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container')}>
                <span className="text-[10px] font-bold uppercase tracking-wider">{day}</span>
                <span className="text-xl font-black">{num}</span>
                {isToday && !isActive && <span className="w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* Stats row — horizontal on mobile */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: 'event_note',      color: 'text-primary',   label: 'Total',     value: stats.total     },
            { icon: 'check_circle',    color: 'text-secondary', label: 'Confirmed', value: stats.confirmed },
            { icon: 'pending_actions', color: 'text-tertiary',  label: 'Pending',   value: stats.pending   },
            { icon: 'task_alt',        color: 'text-outline',   label: 'Done',      value: stats.completed },
          ].map(s => (
            <div key={s.label} className="card p-3 flex flex-col items-center gap-1 text-center">
              <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
              <p className="text-xl font-black text-on-surface">{s.value}</p>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Date heading */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-on-surface font-manrope">
              {dateLabel(selectedDate).full}
            </h3>
            <div className="h-1 w-10 bg-primary-container mt-1.5 rounded-full" />
          </div>
          <button onClick={() => load(selectedDate)}
            className="text-sm text-outline hover:text-primary flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
          </button>
        </div>

        {/* Appointments */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-primary" /></div>
        ) : appointments.length === 0 ? (
          <EmptyState icon="event_available" title="No appointments this day"
            description="Your schedule is clear. Enjoy the break!" />
        ) : (
          <div className="space-y-3">
            {appointments
              .slice().sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
              .map(appt => (
                <AppointmentCard key={appt.id} appt={appt} onClick={() => setSelectedAppt(appt)} />
              ))}
          </div>
        )}

        {/* Doctor profile card */}
        {user?.doctorProfile && (
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg flex-shrink-0">
              {user.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-on-surface">{user.name}</p>
              <p className="text-sm text-outline">{user.doctorProfile.specialization}</p>
              {user.doctorProfile.yearsExperience > 0 && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-primary">workspace_premium</span>
                  {user.doctorProfile.yearsExperience} years experience
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
