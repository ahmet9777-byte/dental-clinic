import Link from 'next/link';
import { PublicNavbar } from '../../components/layout/PublicNavbar';

export const metadata = { title: 'DentaCare — Your Smile, Our Priority' };

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main className="pt-24 bg-surface min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-8 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 space-y-8 animate-slide-up">
            <div className="inline-block px-4 py-1.5 bg-secondary-container text-secondary rounded-full text-label-sm font-bold tracking-widest uppercase">
              Trusted Dental Care Since 2016
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold text-on-surface leading-[1.1] tracking-tight font-manrope">
              Your Smile,{' '}
              <br />
              <span className="text-primary">Our Priority</span>
            </h1>

            <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
              Book appointments online in minutes. Choose your specialist, select your time slot,
              and receive instant email confirmation — all from the comfort of your home.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="px-8 py-4 bg-primary-container text-on-primary-container font-bold rounded-xl shadow-lg hover:scale-[0.98] transition-transform flex items-center gap-2"
              >
                Book Appointment
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link
                href="#doctors"
                className="px-8 py-4 text-primary font-bold hover:bg-primary/5 rounded-xl transition-colors"
              >
                Meet Our Doctors
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div className="w-full md:w-1/2 relative">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-fixed/20 rounded-full blur-3xl -z-10" />
            <div className="aspect-square bg-surface-container-lowest rounded-5xl shadow-cloud-lg overflow-hidden relative border border-white/40">
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[8rem] text-primary/20">dentistry</span>
              </div>
              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 bg-surface-container-lowest/90 backdrop-blur rounded-2xl px-5 py-3 shadow-cloud flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-xl">verified</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">500+ Patients</p>
                  <p className="text-label-sm text-outline">98% Satisfaction Rate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <section className="bg-surface-container-low py-12 border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Happy Patients' },
              { number: '3',    label: 'Specialists'    },
              { number: '8+',   label: 'Years Experience' },
              { number: '98%',  label: 'Satisfaction'   },
            ].map((s) => (
              <div key={s.label} className="text-center space-y-1">
                <div className="text-3xl font-black text-primary font-manrope">{s.number}</div>
                <div className="text-label-sm font-bold text-on-surface-variant tracking-widest uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Doctors section ───────────────────────────────────────────── */}
        <section id="doctors" className="max-w-7xl mx-auto px-8 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <p className="text-label-sm font-bold text-primary tracking-widest uppercase">Our Team</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-manrope">
                Meet Our Specialists
              </h2>
              <p className="text-on-surface-variant max-w-xl">
                World-class dental experts dedicated to restorative and aesthetic excellence.
              </p>
            </div>
            <Link href="/register" className="text-primary font-bold flex items-center gap-2 hover:underline whitespace-nowrap">
              Book with Any Doctor
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Dr. Yousef Haddad', spec: 'Orthodontics',   exp: '12 years', rating: '4.9' },
              { name: 'Dr. Amira Nasser',  spec: 'Endodontics',    exp: '8 years',  rating: '4.8' },
              { name: 'Dr. Lina Barakat',  spec: 'Prosthodontics', exp: '10 years', rating: '5.0' },
            ].map((doc) => (
              <div key={doc.name} className="group card p-6 hover:shadow-cloud-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl mb-6 bg-surface-container flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-[5rem] text-primary/20">person</span>
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-sm font-bold">{doc.rating}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-manrope">{doc.name}</h3>
                  <p className="text-on-surface-variant text-sm font-medium">{doc.spec} · {doc.exp}</p>
                  <Link href="/register">
                    <button className="w-full py-3 bg-surface-container-high text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors mt-2">
                      Book Appointment
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA strip ─────────────────────────────────────────────────── */}
        <section className="bg-primary mx-8 mb-16 rounded-4xl p-12 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4 font-manrope">Ready for Your Next Visit?</h2>
          <p className="text-primary-fixed/80 mb-8 max-w-md mx-auto">
            Book online in under 2 minutes. No phone calls. Instant email confirmation.
          </p>
          <Link href="/register">
            <button className="px-10 py-4 bg-white text-primary font-bold rounded-xl hover:bg-primary-fixed transition-colors">
              Get Started — It's Free
            </button>
          </Link>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-outline-variant/10 py-8 px-8 text-center text-on-surface-variant text-sm">
          <p>© 2026 DentaCare — Clinical Sanctuary. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
