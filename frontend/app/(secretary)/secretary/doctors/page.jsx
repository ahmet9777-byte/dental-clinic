'use client';
import { useEffect, useState } from 'react';
import { Spinner, EmptyState, Button } from '../../../../components/ui';
import api from '../../../../lib/api';

function DoctorCard({ doctor }) {
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-2xl text-primary">person</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-on-surface font-manrope">
            {doctor.user?.name}
          </h3>
          <p className="text-sm text-primary font-semibold">{doctor.specialization}</p>
          <p className="text-xs text-outline mt-0.5">{doctor.user?.email}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${
          doctor.isAvailable
            ? 'bg-secondary-container/40 text-secondary'
            : 'bg-surface-container text-outline'
        }`}>
          {doctor.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container-low rounded-xl p-3">
          <p className="text-label-sm text-outline uppercase tracking-widest">Experience</p>
          <p className="text-lg font-black text-on-surface mt-0.5">
            {doctor.yearsExperience > 0 ? `${doctor.yearsExperience} yrs` : 'N/A'}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-3">
          <p className="text-label-sm text-outline uppercase tracking-widest">Phone</p>
          <p className="text-sm font-bold text-on-surface mt-0.5">
            {doctor.user?.phone ?? '—'}
          </p>
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{doctor.bio}</p>
      )}

      {/* Availability */}
      {doctor.availability && doctor.availability.length > 0 && (
        <div>
          <p className="text-label-sm text-outline uppercase tracking-widest mb-2">Working Days</p>
          <div className="flex gap-1.5 flex-wrap">
            {DAY_NAMES.map((day, i) => {
              const slot = doctor.availability.find(a => a.dayOfWeek === i);
              return (
                <div key={day} className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  slot ? 'bg-primary/10 text-primary' : 'bg-surface-container text-outline'
                }`}>
                  {day}
                  {slot && (
                    <span className="block text-[10px] font-normal opacity-70">
                      {slot.startTime?.slice(0,5)}–{slot.endTime?.slice(0,5)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecretaryDoctorsPage() {
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [spec,     setSpec]     = useState('');

  useEffect(() => {
    api.get('/doctors?limit=50')
      .then(({ data }) => setDoctors(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const specs    = [...new Set(doctors.map(d => d.specialization))];
  const filtered = doctors.filter(d => {
    const matchSearch = !search || d.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchSpec   = !spec   || d.specialization === spec;
    return matchSearch && matchSpec;
  });

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
          Doctors
        </h2>
        <p className="text-on-surface-variant mt-1">
          All clinic doctors and their schedules.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-label-sm font-bold text-outline uppercase tracking-widest">Search</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              type="text"
              placeholder="Doctor name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm font-bold text-outline uppercase tracking-widest">Specialization</label>
          <select value={spec} onChange={e => setSpec(e.target.value)} className="input-field w-52">
            <option value="">All</option>
            {specs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(search || spec) && (
          <button onClick={() => { setSearch(''); setSpec(''); }}
            className="text-sm text-outline hover:text-primary flex items-center gap-1 transition-colors pb-3">
            <span className="material-symbols-outlined text-sm">filter_alt_off</span> Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-outline">
        Showing <strong className="text-on-surface">{filtered.length}</strong> doctor{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="medical_services" title="No doctors found" description="Try adjusting your search." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
        </div>
      )}
    </div>
  );
}
