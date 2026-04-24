'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, AlertBanner } from '../../../components/ui';
import api from '../../../lib/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile form
  const [profile, setProfile]   = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [profMsg, setProfMsg]   = useState({ type: '', text: '' });
  const [profLoad, setProfLoad] = useState(false);

  // Password form
  const [pw, setPw]           = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwMsg, setPwMsg]     = useState({ type: '', text: '' });
  const [pwLoad, setPwLoad]   = useState(false);

  const setP = (f) => (e) => setProfile((p) => ({ ...p, [f]: e.target.value }));
  const setW = (f) => (e) => setPw((p) => ({ ...p, [f]: e.target.value }));

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfLoad(true);
    setProfMsg({ type: '', text: '' });
    try {
      const { data } = await api.patch('/auth/me', {
        name  : profile.name,
        phone : profile.phone || null,
      });
      updateUser(data.data);
      setProfMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfMsg({ type: 'error', text: err.response?.data?.message ?? 'Update failed.' });
    } finally {
      setProfLoad(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmNewPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPwLoad(true);
    setPwMsg({ type: '', text: '' });
    try {
      await api.patch('/auth/me/password', pw);
      setPwMsg({ type: 'success', text: 'Password changed successfully. Your session remains active.' });
      setPw({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message ?? 'Password change failed.' });
    } finally {
      setPwLoad(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-10 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-manrope">
          Profile Settings
        </h2>
        <p className="text-on-surface-variant mt-1">Manage your account information.</p>
      </div>

      {/* Avatar + identity */}
      <div className="card p-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black text-2xl flex-shrink-0">
          {initials}
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface font-manrope">{user?.name}</h3>
          <p className="text-sm text-on-surface-variant">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-secondary-container/40 text-secondary text-label-sm font-bold rounded-full uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile info form */}
      <div className="card p-8 space-y-6">
        <h3 className="text-lg font-bold text-on-surface font-manrope">Personal Information</h3>

        <AlertBanner
          type={profMsg.type || 'info'}
          message={profMsg.text}
          onDismiss={() => setProfMsg({ type: '', text: '' })}
        />

        <form onSubmit={handleProfileSave} className="space-y-5">
          <Input
            label="Full Name"
            icon="person"
            value={profile.name}
            onChange={setP('name')}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="input-field pl-10 opacity-60 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-outline">Email cannot be changed. Contact the clinic to update it.</p>
          </div>
          <Input
            label="Phone Number"
            type="tel"
            icon="phone"
            placeholder="+970 59 1234 567"
            value={profile.phone}
            onChange={setP('phone')}
          />

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={profLoad}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-8 space-y-6">
        <h3 className="text-lg font-bold text-on-surface font-manrope">Change Password</h3>

        <AlertBanner
          type={pwMsg.type || 'info'}
          message={pwMsg.text}
          onDismiss={() => setPwMsg({ type: '', text: '' })}
        />

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <Input
            label="Current Password"
            type="password"
            icon="lock"
            placeholder="Your current password"
            value={pw.currentPassword}
            onChange={setW('currentPassword')}
            required
          />
          <Input
            label="New Password"
            type="password"
            icon="lock_reset"
            placeholder="Min 8 chars, uppercase + number"
            value={pw.newPassword}
            onChange={setW('newPassword')}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            icon="lock_reset"
            placeholder="Repeat your new password"
            value={pw.confirmNewPassword}
            onChange={setW('confirmNewPassword')}
            required
          />

          <div className="p-4 bg-surface-container-low rounded-2xl space-y-1">
            {['At least 8 characters','One uppercase letter','One number'].map((rule) => (
              <p key={rule} className="text-xs text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-outline">check</span>
                {rule}
              </p>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={pwLoad}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card p-8 border-error/20 space-y-4">
        <h3 className="text-lg font-bold text-error font-manrope">Account</h3>
        <p className="text-sm text-on-surface-variant">
          Need help or want to delete your account? Please contact our clinic directly.
        </p>
        <a href="mailto:info@dentacare.com">
          <Button variant="danger" size="sm">
            <span className="material-symbols-outlined text-sm">mail</span>
            Contact Clinic
          </Button>
        </a>
      </div>
    </div>
  );
}
