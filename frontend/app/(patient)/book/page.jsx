'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { DENTAL_CONDITIONS } from '../../../lib/constants';
import { Button, Spinner, AlertBanner } from '../../../components/ui';
import api from '../../../lib/api';

// ─── Step indicator ───────────────────────────────────────────────────────

const STEPS = ['Condition', 'Doctor', 'Schedule', 'Confirm'];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto relative mb-16">
      {/* Track */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-outline-variant/30 -z-0" />
      <div
        className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-500"
        style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
      />

      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="relative z-10 flex flex-col items-center">
            <div
              className={clsx(
                'flex items-center justify-center rounded-full border-4 border-surface font-bold transition-all duration-300',
                done   && 'w-10 h-10 bg-primary text-white shadow-lg',
                active && 'w-12 h-12 bg-primary-container text-on-primary-container shadow-xl',
                !done && !active && 'w-10 h-10 bg-surface-container-high text-outline'
              )}
            >
              {done
                ? <span className="material-symbols-outlined text-base">check</span>
                : <span className={active ? 'text-lg font-black' : 'text-sm font-bold'}>{i + 1}</span>}
            </div>
            <span className={clsx(
              'absolute -bottom-8 text-label-sm font-bold uppercase tracking-tight whitespace-nowrap',
              active ? 'text-on-surface' : done ? 'text-primary' : 'text-outline'
            )}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Condition ────────────────────────────────────────────────────

function StepCondition({ value, onChange, onNext }) {
  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-bold text-on-surface font-manrope mb-1">
          What brings you in today?
        </h3>
        <p className="text-on-surface-variant text-sm">
          Select the dental concern that best describes your visit.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {DENTAL_CONDITIONS.map((c) => (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className={clsx(
              'p-5 rounded-3xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5',
              value === c.value
                ? 'border-primary bg-primary/5 shadow-cloud'
                : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container-low'
            )}
          >
            <span className={clsx(
              'material-symbols-outlined text-2xl mb-3 block',
              value === c.value ? 'text-primary' : 'text-outline'
            )}>
              {c.icon}
            </span>
            <p className={clsx(
              'font-bold text-sm leading-tight',
              value === c.value ? 'text-primary' : 'text-on-surface'
            )}>
              {c.label}
            </p>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="primary" size="lg" onClick={onNext} disabled={!value}>
          Continue to Doctor Selection
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Doctor ───────────────────────────────────────────────────────

function StepDoctor({ value, onChange, onNext, onBack }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors?limit=20')
      .then(({ data }) => setDoctors(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-bold text-on-surface font-manrope mb-1">Choose Your Doctor</h3>
        <p className="text-on-surface-variant text-sm">Select a specialist for your appointment.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {doctors.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onChange(doc)}
              className={clsx(
                'w-full p-5 rounded-3xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-5',
                value?.id === doc.id
                  ? 'border-primary bg-primary/5 shadow-cloud'
                  : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/40'
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-outline">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface">{doc.user?.name}</p>
                <p className="text-sm text-on-surface-variant">{doc.specialization}</p>
                {doc.yearsExperience > 0 && (
                  <p className="text-xs text-outline mt-0.5">{doc.yearsExperience} yrs experience</p>
                )}
              </div>
              {value?.id === doc.id && (
                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!value}>
          Choose Schedule
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Schedule ─────────────────────────────────────────────────────

function StepSchedule({ doctor, date, slot, onDateChange, onSlotChange, onNext, onBack }) {
  const [slotData, setSlotData] = useState(null);
  const [loading,  setLoading]  = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchSlots = useCallback(async (d) => {
    if (!d || !doctor?.id) return;
    setLoading(true);
    setSlotData(null);
    try {
      const { data } = await api.get(`/doctors/${doctor.id}/slots?date=${d}`);
      setSlotData(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [doctor?.id]);

  useEffect(() => { if (date) fetchSlots(date); }, [date, fetchSlots]);

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-bold text-on-surface font-manrope mb-1">Pick a Date & Time</h3>
        <p className="text-on-surface-variant text-sm">
          Showing availability for <strong>{doctor?.user?.name}</strong>
        </p>
      </div>

      {/* Date picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
          Appointment Date
        </label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => { onDateChange(e.target.value); onSlotChange(''); }}
          className="input-field max-w-xs"
        />
      </div>

      {/* Slot grid */}
      {date && (
        <div>
          <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest block mb-4">
            Available Slots
          </label>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner className="text-primary" /></div>
          ) : !slotData ? null
          : !slotData.isWorkingDay ? (
            <div className="p-6 bg-surface-container rounded-2xl text-center">
              <span className="material-symbols-outlined text-3xl text-outline">event_busy</span>
              <p className="text-on-surface-variant mt-2 font-medium">
                {doctor?.user?.name} does not work on {slotData.dayName}s.
                <br />Please select another date.
              </p>
            </div>
          ) : slotData.freeSlots.length === 0 ? (
            <div className="p-6 bg-surface-container rounded-2xl text-center">
              <span className="material-symbols-outlined text-3xl text-outline">event_busy</span>
              <p className="text-on-surface-variant mt-2 font-medium">All slots are booked for this day.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {slotData.allSlots.map((s) => {
                const free   = slotData.freeSlots.includes(s);
                const active = slot === s;
                return (
                  <button
                    key={s}
                    disabled={!free}
                    onClick={() => onSlotChange(s)}
                    className={clsx(
                      'py-2.5 rounded-xl text-sm font-bold transition-all duration-150',
                      active  && 'bg-primary text-white shadow-lg',
                      !active && free && 'bg-surface-container-low text-on-surface hover:bg-primary/10 hover:text-primary',
                      !free   && 'bg-surface-container-highest text-outline cursor-not-allowed line-through opacity-40'
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!date || !slot}>
          Review & Confirm
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Confirm ──────────────────────────────────────────────────────

function StepConfirm({ condition, doctor, date, slot, notes, onNotesChange, onSubmit, onBack, loading, error }) {
  const conditionObj = DENTAL_CONDITIONS.find((c) => c.value === condition);
  const dateDisplay  = new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-bold text-on-surface font-manrope mb-1">Review & Confirm</h3>
        <p className="text-on-surface-variant text-sm">
          Please verify your appointment details before submitting.
        </p>
      </div>

      <AlertBanner type="error" message={error} />

      {/* Summary card */}
      <div className="card p-8 space-y-5">
        {[
          { icon: 'dentistry',       label: 'Condition',    value: conditionObj?.label ?? condition },
          { icon: 'person',          label: 'Doctor',       value: doctor?.user?.name },
          { icon: 'medical_services',label: 'Specialization', value: doctor?.specialization },
          { icon: 'calendar_today',  label: 'Date',         value: dateDisplay },
          { icon: 'schedule',        label: 'Time Slot',    value: slot },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-4 border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">{row.icon}</span>
            </div>
            <div>
              <p className="text-label-sm text-outline uppercase tracking-widest">{row.label}</p>
              <p className="font-bold text-on-surface">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Optional notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
          Additional Notes (optional)
        </label>
        <textarea
          rows={3}
          placeholder="Any specific concerns or information for the doctor…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="input-field resize-none"
          maxLength={500}
        />
        <p className="text-xs text-outline text-right">{notes.length}/500</p>
      </div>

      <div className="p-4 bg-secondary-container/30 border border-secondary/20 rounded-2xl flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-lg mt-0.5">mark_email_read</span>
        <p className="text-sm text-secondary font-medium">
          Upon confirmation by our secretary, you will receive a full appointment summary by email.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back
        </Button>
        <Button variant="primary" size="lg" loading={loading} onClick={onSubmit}>
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Submit Appointment
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function BookPage() {
  const router  = useRouter();
  const [step,      setStep]      = useState(0);
  const [condition, setCondition] = useState('');
  const [doctor,    setDoctor]    = useState(null);
  const [date,      setDate]      = useState('');
  const [slot,      setSlot]      = useState('');
  const [notes,     setNotes]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data } = await api.post('/appointments', {
        doctorId        : doctor.id,
        condition,
        appointmentDate : date,
        timeSlot        : slot,
        notes           : notes || undefined,
      });
      router.push(`/confirmation?id=${data.data.id}`);
    } catch (err) {
      setSubmitError(err.response?.data?.message ?? 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Page header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface font-manrope">
            Book Appointment
          </h2>
          <p className="text-on-surface-variant mt-1">Follow the steps to secure your visit.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-label-sm font-bold text-primary tracking-widest uppercase">Clinic Status</p>
          <div className="flex items-center gap-2 text-secondary font-semibold text-sm mt-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-soft" />
            Open · Accepting Bookings
          </div>
        </div>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Step panels */}
      <div className="card p-8 lg:p-10">
        {step === 0 && (
          <StepCondition
            value={condition}
            onChange={setCondition}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepDoctor
            value={doctor}
            onChange={setDoctor}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepSchedule
            doctor={doctor}
            date={date}
            slot={slot}
            onDateChange={setDate}
            onSlotChange={setSlot}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            condition={condition}
            doctor={doctor}
            date={date}
            slot={slot}
            notes={notes}
            onNotesChange={setNotes}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
            loading={submitting}
            error={submitError}
          />
        )}
      </div>
    </div>
  );
}
