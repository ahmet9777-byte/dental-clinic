'use client';
import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../../../context/AuthContext';
import { StatusBadge, Spinner, Button, EmptyState, AlertBanner } from '../../../../components/ui';
import { conditionLabel } from '../../../../lib/constants';
import api from '../../../../lib/api';

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ icon, iconColor, value, label }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{icon}</span>
      <p className="text-4xl font-black text-on-surface tracking-tighter">{value}</p>
      <p className="text-label-sm text-outline uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ─── Action Modal ─────────────────────────────────────────────────────────
function ActionModal({ appt, action, onClose, onDone }) {
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const isReject = action === 'reject';

  const handleConfirm = async () => {
    setLoading(true); setError('');
    try {
      await api.patch(`/appointments/${appt.id}/${action}`, isReject ? { reason } : {});
      onDone();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Action failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(25,28,30,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-surface-container-lowest rounded-4xl p-6 w-full max-w-md shadow-cloud-lg animate-slide-up space-y-5">
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-2xl flex items-center justify-center',
            isReject ? 'bg-error-container' : 'bg-secondary-container/40')}>
            <span className={clsx('material-symbols-outlined text-xl',
              isReject ? 'text-error' : 'text-secondary')}>
              {isReject ? 'cancel' : 'check_circle'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface font-manrope">
              {isReject ? 'Reject' : 'Confirm'} Appointment
            </h3>
            <p className="text-sm text-on-surface-variant">
              {appt.patient?.name} · {conditionLabel(appt.condition)}
            </p>
          </div>
        </div>
        <AlertBanner type="error" message={error} onDismiss={() => setError('')} />
        {isReject && (
          <textarea rows={3} placeholder="Reason (optional)…"
            value={reason} onChange={e => setReason(e.target.value)}
            className="input-field resize-none w-full" maxLength={300} />
        )}
        {!isReject && (
          <div className="p-3 bg-secondary-container/20 rounded-2xl flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">mark_email_read</span>
            <p className="text-sm text-secondary">A confirmation email will be sent to {appt.patient?.name}.</p>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={isReject ? 'danger' : 'secondary'} className="flex-1"
            loading={loading} onClick={handleConfirm}>
            {isReject ? 'Reject' : 'Confirm & Notify'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Card (Mobile) ─────────────────────────────────────────────
function AppointmentCardMobile({ appt, onAction }) {
  const date = new Date(appt.appointmentDate + 'T00:00:00Z')
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-on-surface">{appt.patient?.name}</p>
          <p className="text-xs text-outline truncate">{appt.patient?.email}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-label-sm text-outline uppercase tracking-wider">Doctor</p>
          <p className="font-medium text-on-surface text-xs">{appt.doctor?.user?.name}</p>
          <p className="text-xs text-outline">{appt.doctor?.specialization}</p>
        </div>
        <div>
          <p className="text-label-sm text-outline uppercase tracking-wider">Condition</p>
          <p className="font-medium text-on-surface text-xs">{conditionLabel(appt.condition)}</p>
        </div>
        <div>
          <p className="text-label-sm text-outline uppercase tracking-wider">Date</p>
          <p className="font-medium text-on-surface text-xs">{date}</p>
        </div>
        <div>
          <p className="text-label-sm text-outline uppercase tracking-wider">Time</p>
          <p className="font-medium text-on-surface text-xs">{appt.timeSlot}</p>
        </div>
      </div>

      {appt.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onAction(appt, 'confirm')}
            className="flex-1 py-2 rounded-xl bg-secondary-container/40 text-secondary font-bold text-sm flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-base">check_circle</span> Confirm
          </button>
          <button onClick={() => onAction(appt, 'reject')}
            className="flex-1 py-2 rounded-xl bg-error-container/40 text-error font-bold text-sm flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-base">cancel</span> Reject
          </button>
        </div>
      )}
      {appt.status === 'confirmed' && (
        <button onClick={() => onAction(appt, 'complete')}
          className="w-full py-2 rounded-xl bg-surface-container text-outline font-bold text-sm flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-base">task_alt</span> Mark Completed
        </button>
      )}
      {appt.emailSent && (
        <p className="text-xs text-secondary flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">mark_email_read</span> Email sent
        </p>
      )}
    </div>
  );
}

// ─── Appointment Row (Desktop) ─────────────────────────────────────────────
function AppointmentRow({ appt, onAction }) {
  const date = new Date(appt.appointmentDate + 'T00:00:00Z')
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

  return (
    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
      <td className="py-3 px-4">
        <p className="font-bold text-on-surface text-sm">{appt.patient?.name}</p>
        <p className="text-xs text-outline">{appt.patient?.email}</p>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-on-surface">{appt.doctor?.user?.name}</p>
        <p className="text-xs text-outline">{appt.doctor?.specialization}</p>
      </td>
      <td className="py-3 px-4 text-sm">{conditionLabel(appt.condition)}</td>
      <td className="py-3 px-4 text-sm whitespace-nowrap">{date} · {appt.timeSlot}</td>
      <td className="py-3 px-4"><StatusBadge status={appt.status} /></td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          {appt.status === 'pending' && (<>
            <button onClick={() => onAction(appt, 'confirm')}
              className="p-1.5 rounded-lg bg-secondary-container/30 text-secondary hover:bg-secondary-container transition-colors" title="Confirm">
              <span className="material-symbols-outlined text-base">check_circle</span>
            </button>
            <button onClick={() => onAction(appt, 'reject')}
              className="p-1.5 rounded-lg bg-error-container/40 text-error hover:bg-error-container transition-colors" title="Reject">
              <span className="material-symbols-outlined text-base">cancel</span>
            </button>
          </>)}
          {appt.status === 'confirmed' && (
            <button onClick={() => onAction(appt, 'complete')}
              className="p-1.5 rounded-lg bg-surface-container text-outline hover:bg-surface-container-high transition-colors" title="Complete">
              <span className="material-symbols-outlined text-base">task_alt</span>
            </button>
          )}
          {appt.emailSent && (
            <span className="material-symbols-outlined text-secondary text-base" title="Email sent">mark_email_read</span>
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
  const [modal,        setModal]        = useState(null);
  const [apiError,     setApiError]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true); setApiError('');
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus) params.set('status', filterStatus);
      if (filterDate)   params.set('date', filterDate);
      if (search)       params.set('search', search);
      const { data } = await api.get(`/appointments?${params.toString()}`);
      setAppointments(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      setApiError(e.response?.data?.message || e.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [page, filterStatus, filterDate, search]);

  useEffect(() => { load(); }, [load]);

  const handleAction = (appt, action) => setModal({ appt, action });
  const handleDone   = () => { setModal(null); load(); };

  const stats = {
    total    : total,
    pending  : appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter(a => String(a.appointmentDate).slice(0, 10) === today).length;

  return (
    <>
      {modal && <ActionModal appt={modal.appt} action={modal.action} onClose={() => setModal(null)} onDone={handleDone} />}

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            Clinical Overview
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">{user?.name} · Clinic Secretary</p>
          <p className="text-label-sm font-bold text-primary tracking-widest uppercase mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Error */}
        {apiError && (
          <div className="p-4 bg-error-container border border-error/20 rounded-2xl text-sm text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {apiError}
            <button onClick={load} className="ml-auto underline font-bold">Retry</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="calendar_month"  iconColor="text-primary"    value={todayCount}      label="Today"     />
          <StatCard icon="pending_actions" iconColor="text-tertiary"   value={stats.pending}   label="Pending"   />
          <StatCard icon="check_circle"    iconColor="text-secondary"  value={stats.confirmed} label="Confirmed" />
          <StatCard icon="groups"          iconColor="text-on-surface" value={total}           label="Total"     />
        </div>

        {/* Filters */}
        <div className="card p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input type="text" placeholder="Search patient name…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10 w-full" />
          </div>
          {/* Status + Date row */}
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="input-field flex-1 min-w-0">
              <option value="">All Statuses</option>
              {['pending','confirmed','rejected','completed'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <input type="date" value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setPage(1); }}
              className="input-field flex-1 min-w-0" />
          </div>
          {(filterStatus || filterDate || search) && (
            <button onClick={() => { setFilterStatus(''); setFilterDate(''); setSearch(''); setPage(1); }}
              className="text-sm text-outline hover:text-primary flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm">filter_alt_off</span> Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-primary" /></div>
        ) : appointments.length === 0 ? (
          <EmptyState icon="calendar_today" title="No appointments found" description="Try adjusting your filters." />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {appointments.map(a => <AppointmentCardMobile key={a.id} appt={a} onAction={handleAction} />)}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                      {['Patient','Doctor','Condition','Date & Time','Status','Actions'].map(h => (
                        <th key={h} className="py-3 px-4 text-left text-label-sm font-bold text-outline uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => <AppointmentRow key={a.id} appt={a} onAction={handleAction} />)}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-outline">
              {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button variant="surface" size="sm" onClick={() => setPage(p=>p-1)} disabled={page===1}>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </Button>
              <Button variant="surface" size="sm" onClick={() => setPage(p=>p+1)} disabled={page*LIMIT>=total}>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
