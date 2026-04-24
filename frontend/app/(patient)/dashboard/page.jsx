'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge, EmptyState, Spinner, Button } from '../../../components/ui';
import { conditionLabel } from '../../../lib/constants';
import api from '../../../lib/api';

// ─── Stat card ────────────────────────────────────────────────────────────

function StatCard({ icon, iconColor, value, label, accent }) {
  return (
    <div className={`card p-8 flex flex-col justify-between ${accent ? `border-b-4 ${accent}` : ''}`}>
      <span className={`material-symbols-outlined text-3xl mb-4 ${iconColor}`}>{icon}</span>
      <p className="text-5xl font-black text-on-surface tracking-tighter">{value}</p>
      <p className="text-label-sm text-outline uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
}

// ─── Appointment row card ─────────────────────────────────────────────────

function AppointmentCard({ appt }) {
  const date = new Date(appt.appointmentDate + 'T00:00:00Z');
  const month = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  const day   = date.getUTCDate();

  return (
    <div className="group card p-6 hover:-translate-y-1 hover:shadow-cloud-lg transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-6">
      {/* Date badge */}
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-outline uppercase">{month}</span>
        <span className="text-2xl font-black text-on-surface">{day}</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-label-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            #{String(appt.id).padStart(4, '0')}
          </span>
          <StatusBadge status={appt.status} />
        </div>
        <h4 className="text-lg font-bold text-on-surface">{conditionLabel(appt.condition)}</h4>
        <p className="text-sm text-on-surface-variant font-medium">
          {appt.doctor?.user?.name ?? 'Doctor TBD'} · {appt.timeSlot}
        </p>
        {appt.rejectedReason && (
          <p className="text-xs text-error mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            {appt.rejectedReason}
          </p>
        )}
      </div>

      {/* Right section */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-outline uppercase tracking-widest">
          {appt.doctor?.specialization}
        </p>
        {appt.emailSent && (
          <p className="text-xs text-secondary flex items-center gap-1 justify-end mt-1">
            <span className="material-symbols-outlined text-sm">mark_email_read</span>
            Confirmed by email
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/appointments/my?limit=10');
      setAppointments(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total     : appointments.length,
    confirmed : appointments.filter((a) => a.status === 'confirmed').length,
    pending   : appointments.filter((a) => a.status === 'pending').length,
    completed : appointments.filter((a) => a.status === 'completed').length,
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            Welcome back, {firstName} 👋
          </h2>
          <p className="text-on-surface-variant mt-1">
            {stats.pending > 0
              ? `You have ${stats.pending} pending appointment${stats.pending > 1 ? 's' : ''} awaiting confirmation.`
              : 'Your smile is in great shape. Book your next visit anytime.'}
          </p>
        </div>
        <Link href="/book">
          <Button variant="primary" size="md">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="event_note"     iconColor="text-primary"   value={stats.total}     label="Total Visits" />
        <StatCard icon="check_circle"   iconColor="text-secondary" value={stats.confirmed} label="Confirmed"     accent="border-secondary/20" />
        <StatCard icon="pending_actions" iconColor="text-tertiary"  value={stats.pending}   label="Pending"       accent="border-tertiary/20" />
        <StatCard icon="task_alt"       iconColor="text-outline"   value={stats.completed} label="Completed" />
      </div>

      {/* Appointments list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold text-on-surface font-manrope">Your Appointments</h3>
              <div className="h-1 w-12 bg-primary-container mt-2 rounded-full" />
            </div>
            {appointments.length > 0 && (
              <button onClick={load} className="text-sm text-outline hover:text-primary flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-sm">refresh</span> Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" className="text-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon="calendar_today"
              title="No appointments yet"
              description="Book your first appointment and we'll take care of the rest."
              action={
                <Link href="/book">
                  <Button variant="primary">Book Now</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {appointments.map((a) => <AppointmentCard key={a.id} appt={a} />)}
            </div>
          )}
        </div>

        {/* Quick actions sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-2xl font-bold text-on-surface font-manrope">Quick Actions</h3>

          <div className="space-y-3">
            {[
              { icon: 'calendar_add_on', label: 'Book Appointment',  href: '/book',     color: 'text-primary'   },
              { icon: 'medical_services',label: 'Browse Doctors',    href: '/book',     color: 'text-secondary' },
              { icon: 'manage_accounts', label: 'Edit Profile',      href: '/profile',  color: 'text-on-surface' },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-cloud-lg transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <span className={`material-symbols-outlined text-xl ${action.color}`}>{action.icon}</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">{action.label}</span>
                  <span className="material-symbols-outlined text-outline text-lg ml-auto">chevron_right</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Status legend */}
          <div className="card p-6 space-y-3">
            <p className="text-label-sm font-bold text-outline uppercase tracking-widest">Status Guide</p>
            {[
              { color: 'bg-tertiary/30',  label: 'Pending — awaiting secretary review' },
              { color: 'bg-secondary/30', label: 'Confirmed — email sent to you' },
              { color: 'bg-error/20',     label: 'Rejected — please rebook' },
              { color: 'bg-outline/20',   label: 'Completed — visit done' },
            ].map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${s.color}`} />
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
