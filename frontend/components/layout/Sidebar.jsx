'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ navItems, role }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const roleLabel = {
    patient   : 'Active Patient',
    secretary : 'Clinic Secretary',
    doctor    : 'Attending Doctor',
  }[role] ?? role;

  const NavLink = ({ item }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium font-manrope',
          active
            ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface'
        )}
      >
        <span className="material-symbols-outlined text-xl">{item.icon}</span>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex-col p-4 z-40 border-r border-outline-variant/10">
        {/* Logo */}
        <div className="px-4 py-6 mb-4">
          <h1 className="text-xl font-bold text-primary font-manrope tracking-tight">DentaCare</h1>
          <p className="text-label-sm text-outline uppercase tracking-widest mt-1">Clinical Sanctuary</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>

        {/* User card */}
        <div className="border-t border-outline-variant/20 pt-4 mt-4">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
              <p className="text-label-sm text-outline uppercase tracking-wider">{roleLabel}</p>
            </div>
          </div>
          <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container/60 transition-colors">
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-error hover:bg-error-container/30 transition-colors mt-1">
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant/10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-primary font-manrope">DentaCare</h1>
          <p className="text-[10px] text-outline uppercase tracking-widest -mt-0.5">Clinical Sanctuary</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">
            {initials}
          </div>
          <button onClick={logout} className="p-2 rounded-xl text-error hover:bg-error-container/30 transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/10 px-2 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-0',
                  active
                    ? 'text-primary'
                    : 'text-outline hover:text-on-surface'
                )}
              >
                <span className={clsx(
                  'material-symbols-outlined text-2xl transition-all',
                  active && 'text-primary'
                )} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold truncate max-w-[60px] text-center">
                  {item.label.split(' ')[0]}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
