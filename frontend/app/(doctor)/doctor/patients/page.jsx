'use client';
import { useEffect, useState, useCallback } from 'react';
import { Spinner, EmptyState, StatusBadge } from '../../../../components/ui';
import { conditionLabel } from '../../../../lib/constants';
import api from '../../../../lib/api';

function PatientCard({ patient, appointments }) {
  const [expanded, setExpanded] = useState(false);

  const total     = appointments.length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const latest    = appointments[0];

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-5 p-5 hover:bg-surface-container-low/50 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg flex-shrink-0">
          {patient.name?.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface">{patient.name}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {patient.email && (
              <span className="text-xs text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">mail</span>
                {patient.email}
              </span>
            )}
            {patient.phone && (
              <span className="text-xs text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">phone</span>
                {patient.phone}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-center">
            <p className="text-label-sm text-outline uppercase tracking-wider">Visits</p>
            <p className="text-2xl font-black text-on-surface">{total}</p>
          </div>
          <div className="text-center">
            <p className="text-label-sm text-outline uppercase tracking-wider">Done</p>
            <p className="text-2xl font-black text-secondary">{completed}</p>
          </div>
          {latest && (
            <div className="text-center hidden md:block">
              <p className="text-label-sm text-outline uppercase tracking-wider">Last Visit</p>
              <p className="text-sm font-bold text-on-surface">
                {String(latest.appointmentDate).slice(0, 10)}
              </p>
            </div>
          )}
        </div>

        <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {expanded && (
        <div className="border-t border-outline-variant/10 p-5 space-y-3">
          <p className="text-label-sm font-bold text-outline uppercase tracking-widest mb-3">
            Appointment History
          </p>
          {appointments.map(appt => {
            const date = new Date(appt.appointmentDate + 'T00:00:00Z').toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
            });
            return (
              <div key={appt.id} className="flex items-center gap-4 p-3 bg-surface-container-low rounded-2xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-label-sm font-bold text-primary">
                      #{String(appt.id).padStart(4, '0')}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    {conditionLabel(appt.condition)}
                  </p>
                  <p className="text-xs text-outline">{date} · {appt.timeSlot}</p>
                  {appt.notes && (
                    <p className="text-xs text-on-surface-variant mt-1 italic">"{appt.notes}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // جيب كل المواعيد بدون فلتر تاريخ
      const { data } = await api.get('/doctor/schedule?status=all');
      const appts = data.data ?? [];

      // Group by patient
      const map = {};
      for (const appt of appts) {
        const pid = appt.patient?.id;
        if (!pid) continue;
        if (!map[pid]) map[pid] = { patient: appt.patient, appointments: [] };
        map[pid].appointments.push(appt);
      }

      // Sort each patient's appointments by date desc
      const list = Object.values(map).map(entry => ({
        ...entry,
        appointments: entry.appointments.sort((a, b) =>
          new Date(b.appointmentDate) - new Date(a.appointmentDate)
        ),
      }));

      setPatients(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(({ patient }) =>
    !search ||
    patient.name?.toLowerCase().includes(search.toLowerCase()) ||
    patient.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            My Patients
          </h2>
          <p className="text-on-surface-variant mt-1">
            All patients who have appointments with you.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2.5 rounded-2xl">
          <span className="material-symbols-outlined text-primary text-xl">groups</span>
          <div>
            <p className="text-label-sm text-outline uppercase tracking-wider">Total Patients</p>
            <p className="text-2xl font-black text-on-surface">{patients.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
          search
        </span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title="No patients found"
          description={search ? 'Try a different search.' : 'No appointments yet.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(({ patient, appointments }) => (
            <PatientCard key={patient.id} patient={patient} appointments={appointments} />
          ))}
        </div>
      )}
    </div>
  );
}
