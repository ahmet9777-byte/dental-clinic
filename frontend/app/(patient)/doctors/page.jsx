'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spinner, EmptyState, Button } from '../../../components/ui';
import api from '../../../lib/api';

function DoctorCard({ doctor }) {
  return (
    <div className="card p-6 hover:-translate-y-1 hover:shadow-cloud-lg transition-all duration-300 flex flex-col gap-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-3xl text-outline">person</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface font-manrope">
            {doctor.user?.name}
          </h3>
          <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2">
        {doctor.yearsExperience > 0 && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-outline">workspace_premium</span>
            {doctor.yearsExperience} years of experience
          </div>
        )}
        {doctor.bio && (
          <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
            {doctor.bio}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${doctor.isAvailable ? 'bg-secondary' : 'bg-outline'}`} />
          <span className={doctor.isAvailable ? 'text-secondary font-medium' : 'text-outline'}>
            {doctor.isAvailable ? 'Available for booking' : 'Not available'}
          </span>
        </div>
      </div>

      {/* Availability days */}
      {doctor.availability && doctor.availability.length > 0 && (
        <div>
          <p className="text-label-sm text-outline uppercase tracking-widest mb-2">Working Days</p>
          <div className="flex gap-1.5 flex-wrap">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => {
              const works = doctor.availability.some(a => a.dayOfWeek === i);
              return (
                <span
                  key={day}
                  className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    works
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Book button */}
      {doctor.isAvailable && (
        <Link href={`/book`}>
          <Button variant="primary" className="w-full" size="md">
            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
            Book Appointment
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [spec,     setSpec]     = useState('');
  const [specs,    setSpecs]    = useState([]);

  useEffect(() => {
    api.get('/doctors?limit=50')
      .then(({ data }) => {
        setDoctors(data.data ?? []);
        // Extract unique specializations
        const unique = [...new Set((data.data ?? []).map(d => d.specialization))];
        setSpecs(unique);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(d => {
    const matchSearch = !search || d.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchSpec   = !spec   || d.specialization === spec;
    return matchSearch && matchSpec;
  });

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
            Our Doctors
          </h2>
          <p className="text-on-surface-variant mt-1">
            Browse our specialists and book your appointment.
          </p>
        </div>
        <Link href="/book">
          <Button variant="primary" size="md">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Book Now
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-label-sm font-bold text-outline uppercase tracking-widest">
            Search Doctor
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
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
          <label className="text-label-sm font-bold text-outline uppercase tracking-widest">
            Specialization
          </label>
          <select
            value={spec}
            onChange={e => setSpec(e.target.value)}
            className="input-field w-52"
          >
            <option value="">All Specializations</option>
            {specs.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {(search || spec) && (
          <button
            onClick={() => { setSearch(''); setSpec(''); }}
            className="text-sm text-outline hover:text-primary flex items-center gap-1 transition-colors pb-3"
          >
            <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            Clear
          </button>
        )}
      </div>

      {/* Doctors grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="medical_services"
          title="No doctors found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(doc => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
