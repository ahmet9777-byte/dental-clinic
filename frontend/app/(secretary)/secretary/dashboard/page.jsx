'use client';
import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../../../context/AuthContext';
import { StatusBadge, Spinner, Button, EmptyState, AlertBanner } from '../../../../components/ui';
import { conditionLabel } from '../../../../lib/constants';
import api from '../../../../lib/api';

// ─── Stat card ────────────────────────────────────────────────────────────

function StatCard({ icon, iconColor, value, label, hoverBg }) {
  return (
    <div className={clsx(
      'card p-6 group cursor-default transition-colors duration-300',
      hoverBg
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-current/5 rounded-xl group-hover:bg-white/20 transition-colors">
          <span className={`material-symbols-outlined ${iconColor} group-hover:text-white`}>{icon}</span>
        </div>
      </div>
      <h3 className="text-4xl font-black text-on-surface group-hover:text-white font-manrope">{value}</h3>
      <p className="text-label-sm text-outline group-hover:text-white/70 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

// ─── Confirm/Reject modal ─────────────────────────────────────────────────

function ActionModal({ appt, action, onClose, onDone }) {
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const isReject = action === 'reject';

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `/appointments/${appt.id}/${action}`;
      const body = isReject ? { reason } : {};
      await api.patch(url, body);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(25,28,30,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-surface-container-lowest rounded-4xl p-8 w-full max-w-md shadow-cloud-lg animate-slide-up space-y-6">
        <div className="flex items-center gap-4">
          <div className={clsx(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            isReject ? 'bg-error-container' : 'bg-secondary-container/40'
          )}>
            <span className={clsx(
              'material-symbols-outlined text-2xl',
              isReject ? 'text-error' : 'text-secondary'
            )}>
              {isReject ? 'cancel' : 'check_circle'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface font-manrope">
              {isReject ? 'Reject Appointment' : 'Confirm Appointment'}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {appt.patient?.name} · {conditionLabel(appt.condition)}
            </p>
          </div>
        </div>

        <AlertBanner type="error" message={error} onDismiss={() => setError('')} />

        {isReject && (
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
              Reason (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Doctor unavailable on that date…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field resize-none"
              maxLength={300}
            />
          </div>
        )}

        {!isReject && (
          <div className="p-4 bg-secondary-container/20 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-lg">mark_email_read</span>
            <p className="text-sm text-secondary">
              An automated confirmation email will be sent to{' '}
              <strong>{appt.patient?.name}</strong> via n8n.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={isReject ? 'danger' : 'secondary'}
            className="flex-1"
            loading={loading}
            onClick={handleConfirm}
          >
            {isReject ? 'Reject' : 'Confirm & Notify'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment row ──────────────────────────────────────────────────────

function AppointmentRow({ appt, onAction }) {
  const date = new Date(appt.appointmentDate + 'T00:00:00Z')
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

  return (
    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
      <td className="py-4 px-4">
        <div>
          <p className="font-bold text-on-surface text-sm">{appt.patient?.name}</p>
          <p className="text-xs text-outline">{appt.patient?.email}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        <div>
          <p className="text-sm font-medium text-on-surface">{appt.doctor?.user?.name}</p>
          <p className="text-xs text-outline">{appt.doctor?.specialization}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-on-surface">{conditionLabel(appt.condition)}</span>
      </td>
      <td className="py-4 px-4 text-sm text-on-surface whitespace-nowrap">
        {date} · {appt.timeSlot}
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={appt.status} />
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {appt.status === 'pending' && (
            <>
              <button
                onClick={() => onAction(appt, 'confirm')}
                className="p-2 rounded-xl bg-secondary-container/30 text-secondary hover:bg-secondary-container transition-colors"
                title="Confirm"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </button>
              <button
                onClick={() => onAction(appt, 'reject')}
                className="p-2 rounded-xl bg-error-container/40 text-error hover:bg-error-container transition-colors"
                title="Reject"
              >
                <span className="material-symbols-outlined text-lg">cancel</span>
              </button>
            </>
          )}
          {appt.status === 'confirmed' && (
            <button
              onClick={() => onAction(appt, 'complete')}
              className="p-2 rounded-xl bg-surface-container text-outline hover:bg-surface-container-high transition-colors"
              title="Mark completed"
            >
              <span className="material-symbols-outlined text-lg">task_alt</span>
            </button>
          )}
          {appt.emailSent && (
            <span className="material-symbols-outlined text-secondary text-lg" title="Email sent">
              mark_email_read
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function SecretaryDashboard() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);  // { appt, action }

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const LIMIT = 15;

  const [apiError, setApiError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set('status', filterStatus);
      if (filterDate)   params.set('date', filterDate);
      if (search)       params.set('search', search);

      const { data } = await api.get(`/appointments?${params.toString()}`);
      setAppointments(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load appointments';
      setApiError(`Error ${e.response?.status ?? ''}: ${msg}`);
      console.error('Secretary load error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterDate, search]);

  useEffect(() => { load(); }, [load]);

  const handleAction = (appt, action) => setModal({ appt, action });

  const handleActionDone = () => {
    setModal(null);
    load();
  };

  const stats = {
    total    : total,
    pending  : appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  const today = new Date().toISOString().split('T')[0];
  // appointmentDate may come as "2026-04-23T00:00:00.000Z" or "2026-04-23"
  const todayCount = appointments.filter((a) => {
    const d = a.appointmentDate ? String(a.appointmentDate).slice(0, 10) : '';
    return d === today;
  }).length;

  return (
    <>
      {modal && (
        <ActionModal
          appt={modal.appt}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={handleActionDone}
        />
      )}

      <div className="space-y-10 animate-fade-in">
        {/* Error banner */}
        {apiError && (
          <div className="flex items-start gap-3 p-4 bg-error-container border border-error/20 rounded-2xl">
            <span className="material-symbols-outlined text-error text-xl mt-0.5">error</span>
            <div className="flex-1">
              <p className="font-bold text-error text-sm">Failed to load appointments</p>
              <p className="text-error/80 text-xs mt-1">{apiError}</p>
              <button
                onClick={load}
                className="mt-2 text-xs font-bold text-error underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
              Clinical Overview
            </h2>
            <p className="text-on-surface-variant mt-1">
              {user?.name} · Clinic Secretary
            </p>
          </div>
          <p className="text-label-sm font-bold text-primary tracking-widest uppercase">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon="calendar_month"  iconColor="text-primary"   value={todayCount}      label="Today"     hoverBg="hover:bg-primary-container" />
          <StatCard icon="pending_actions" iconColor="text-tertiary"  value={stats.pending}   label="Pending"   hoverBg="hover:bg-tertiary-container" />
          <StatCard icon="check_circle"    iconColor="text-secondary" value={stats.confirmed} label="Confirmed" hoverBg="hover:bg-secondary" />
          <StatCard icon="groups"          iconColor="text-on-surface" value={total}           label="Total"     hoverBg="hover:bg-on-surface" />
        </div>

        {/* Filter bar */}
        <div className="card p-5 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-label-sm font-bold text-outline uppercase tracking-widest">Search patient</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                type="text"
                placeholder="Patient name…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold text-outline uppercase tracking-widest">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="input-field w-44"
            >
              <option value="">All Statuses</option>
              {['pending','confirmed','rejected','completed'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold text-outline uppercase tracking-widest">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
              className="input-field w-44"
            />
          </div>

          {(filterStatus || filterDate || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus(''); setFilterDate(''); setSearch(''); setPage(1); }}
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  {['Patient','Doctor','Condition','Date & Time','Status','Actions'].map((h) => (
                    <th key={h} className="py-4 px-4 text-left text-label-sm font-bold text-outline uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Spinner size="lg" className="text-primary mx-auto" />
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <EmptyState
                        icon="calendar_today"
                        title="No appointments found"
                        description="Try adjusting your filters."
                      />
                    </td>
                  </tr>
                ) : appointments.map((a) => (
                  <AppointmentRow key={a.id} appt={a} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
              <p className="text-sm text-outline">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="surface" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </Button>
                <Button variant="surface" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total}>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
