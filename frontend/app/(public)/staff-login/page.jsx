'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, AlertBanner } from '../../../components/ui';

export default function StaffLoginPage() {
  const { staffLogin } = useAuth();
  const router = useRouter();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setLoading(true);
    try {
      const user = await staffLogin(form.email, form.password);
      if (user.role === 'secretary') router.push('/secretary/dashboard');
      else if (user.role === 'doctor') router.push('/doctor/schedule');
      else router.push('/');
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-on-surface to-outline-variant flex-col justify-between p-12">
        <Link href="/" className="text-2xl font-black text-white font-manrope">DentaCare</Link>

        <div className="space-y-8">
          <div className="w-20 h-1 bg-primary-container rounded-full" />
          <h1 className="text-5xl font-extrabold text-white leading-tight font-manrope">
            Staff Portal
          </h1>
          <p className="text-white/60 text-lg max-w-sm leading-relaxed">
            Secure access for clinic secretaries and attending doctors.
          </p>

          {/* Role cards */}
          <div className="space-y-4 mt-8">
            {[
              { role: 'Secretary', icon: 'admin_panel_settings', desc: 'Manage appointments & patient flow' },
              { role: 'Doctor',    icon: 'stethoscope',          desc: 'View schedule & patient records'   },
            ].map((r) => (
              <div key={r.role} className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur">
                <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-xl">{r.icon}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{r.role}</p>
                  <p className="text-white/50 text-xs">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-sm">Protected by JWT · Role-Based Access Control</p>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div>
            <Link href="/" className="text-xl font-black text-primary font-manrope lg:hidden">DentaCare</Link>
            <p className="text-label-sm font-bold text-primary tracking-widest uppercase mt-4">Staff Portal</p>
            <h2 className="text-3xl font-extrabold text-on-surface mt-1 font-manrope">Sign In</h2>
            <p className="text-on-surface-variant mt-1 text-sm">For clinic secretaries and doctors.</p>
          </div>

          <AlertBanner type="error" message={apiError} onDismiss={() => setApiError('')} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Staff Email"
              type="email"
              placeholder="staff@dentacare.com"
              icon="badge"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
                  lock
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
              Access Staff Portal
            </Button>
          </form>

          {/* Security note */}
          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl">
            <span className="material-symbols-outlined text-outline text-lg mt-0.5">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This portal is restricted to authorised clinic staff only. Patient accounts should
              use the{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                patient login
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
