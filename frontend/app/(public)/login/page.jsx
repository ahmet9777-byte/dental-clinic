'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, AlertBanner } from '../../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-black text-primary font-manrope">DentaCare</Link>
          <h1 className="text-3xl font-extrabold text-on-surface mt-6 font-manrope">Welcome Back</h1>
          <p className="text-on-surface-variant mt-2">Sign in to your patient portal.</p>
        </div>

        <div className="card p-8 space-y-6">
          <AlertBanner type="error" message={apiError} onDismiss={() => setApiError('')} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              icon="mail"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
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
                  <span className="material-symbols-outlined text-lg">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Sign In to My Portal
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface-container-lowest px-3 text-outline">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-on-surface-variant">
            New patient?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
          </p>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Clinic staff?{' '}
          <Link href="/staff-login" className="text-secondary font-semibold hover:underline">Use the staff portal</Link>
        </p>
      </div>
    </div>
  );
}
