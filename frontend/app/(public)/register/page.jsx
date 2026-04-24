'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, AlertBanner } from '../../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm]     = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
  const e = {};
  if (!form.name.trim() || form.name.length < 2)    e.name     = 'Full name must be at least 2 characters.';
  if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/))   e.email    = 'Please enter a valid email address.';
  if (form.password.length < 8)                      e.password = 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(form.password))                 e.password = 'Password must contain an uppercase letter.';
  if (!/\d/.test(form.password))                    e.password = 'Password must contain a number.';
  return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12">
        <Link href="/" className="text-2xl font-black text-white font-manrope">DentaCare</Link>
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold text-white leading-tight font-manrope">
            Begin Your<br/>Journey to a<br/>
            <span className="text-primary-fixed-dim">Perfect Smile.</span>
          </h1>
          <p className="text-primary-fixed/80 text-lg max-w-sm">
            Join 500+ patients who manage their dental care effortlessly online.
          </p>
        </div>
        <div className="flex items-center gap-4 text-primary-fixed/60 text-sm">
          <span className="material-symbols-outlined">lock</span>
          Your data is encrypted and secure
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div>
            <Link href="/" className="text-xl font-black text-primary font-manrope lg:hidden">DentaCare</Link>
            <h2 className="text-3xl font-extrabold text-on-surface mt-2 font-manrope">Create Account</h2>
            <p className="text-on-surface-variant mt-1">Fill in your details to get started.</p>
          </div>

          <AlertBanner type="error" message={apiError} onDismiss={() => setApiError('')} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="Sara Khalil"
              icon="person"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="sara@example.com"
              icon="mail"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              icon="lock"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              required
            />
            <Input
              label="Phone Number (optional)"
              type="tel"
              placeholder="+970 59 1234 567"
              icon="phone"
              value={form.phone}
              onChange={set('phone')}
              error={errors.phone}
            />

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Create My Account
            </Button>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-sm text-on-surface-variant">
            Are you clinic staff?{' '}
            <Link href="/staff-login" className="text-secondary font-semibold hover:underline">Staff login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
