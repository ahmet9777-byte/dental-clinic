'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ navItems, role }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const roleLabel = {
    patient   : 'Active Patient',
    secretary : 'Clinic Secretary',
    doctor    : 'Attending Doctor',
  }[role] ?? role;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col p-4 z-40 border-r border-outline-variant/10">
      {/* Logo */}
      <div className="px-4 py-6 mb-4">
        <h1 className="text-xl font-bold text-primary font-manrope tracking-tight">DentaCare</h1>
        <p className="text-label-sm text-outline uppercase tracking-widest mt-1">Clinical Sanctuary</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
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
        })}
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

        <Link
          href="/profile"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container/60 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          Settings
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-error hover:bg-error-container/30 transition-colors mt-1"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
