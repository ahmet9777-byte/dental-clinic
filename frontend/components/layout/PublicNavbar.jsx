'use client';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

export function PublicNavbar() {
  const { isLoggedIn, user, redirectByRole } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="flex justify-between items-center px-8 py-4 w-full max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black text-primary font-manrope tracking-tight">
          Denta<span className="text-primary-container">Care</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-manrope font-semibold">
          <Link href="/"        className="text-primary border-b-2 border-primary pb-0.5">Home</Link>
          <Link href="/doctors" className="text-on-surface-variant hover:text-primary transition-colors">Doctors</Link>
          <a    href="#about"   className="text-on-surface-variant hover:text-primary transition-colors">About</a>
          <a    href="#contact" className="text-on-surface-variant hover:text-primary transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Button variant="primary" onClick={() => redirectByRole(user)} size="sm">
              Go to Portal
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Book Now</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
