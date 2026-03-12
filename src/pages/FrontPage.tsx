import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './FrontPage.module.css';

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Complete Device Control',
    text: 'Manage lights, climate systems, appliances, and locks from one unified command center. Toggle any device on or off instantly.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Room Management',
    text: 'Organize devices by room across multiple houses. Track which devices are active in each space at a glance.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    title: 'Smart Automations',
    text: 'Set up automation rules to trigger devices on schedule or by condition. Let your home respond intelligently without manual input.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Multi-House Dashboard',
    text: 'Manage multiple properties from a single account. Each house has its own rooms, devices, and dedicated dashboard.',
  },
];

const highlights = [
  { label: 'Device Types', value: '20+' },
  { label: 'Real-Time Toggle', value: 'Instant' },
  { label: 'Floor Levels', value: '6' },
  { label: 'Houses Supported', value: 'Unlimited' },
];

export function FrontPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={`${styles.gridPattern} min-h-screen bg-[#060d19] text-slate-100`}>
      {/* Navbar */}
      <nav className={`${styles.navBar} fixed left-0 right-0 top-0 z-50`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
              <svg className="h-4.5 w-4.5 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-base font-extrabold tracking-tight text-white">The Smart Home</span>
          </div>

          <div className="flex items-center gap-5">
            <a className="hidden text-sm font-medium text-slate-300 transition hover:text-cyan-300 md:inline" href="#features">Features</a>
            <a className="hidden text-sm font-medium text-slate-300 transition hover:text-cyan-300 md:inline" href="#how-it-works">How It Works</a>
            {isAuthenticated ? (
              <Link className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5" to="/houses">
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:text-white" to="/login">
                  Sign In
                </Link>
                <Link className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5" to="/register">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={`${styles.heroGlow} mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-32`}>
        <div>
          <p className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            IoT Smart Home Platform
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.1] text-white md:text-[3.5rem]">
            Your Home,{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
              Intelligently Connected
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
            One platform to control every device, manage rooms across multiple houses, and automate
            your daily routines. Built for homeowners who want clarity and control.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                to="/houses"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                  to="/register"
                >
                  Create Free Account
                </Link>
                <Link
                  className="rounded-xl border border-cyan-200/30 bg-slate-900/60 px-6 py-3.5 text-sm font-bold text-cyan-100 transition hover:-translate-y-0.5 hover:border-cyan-200/50"
                  to="/login"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className={`${styles.deviceFrame} p-4 md:p-5`}>
          <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-200">Dashboard Preview</p>
              </div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                LIVE
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <article className="rounded-xl border border-cyan-300/20 bg-slate-800/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rooms</p>
                <p className="mt-1 text-xl font-black text-cyan-200">5</p>
              </article>
              <article className="rounded-xl border border-cyan-300/20 bg-slate-800/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Devices</p>
                <p className="mt-1 text-xl font-black text-cyan-200">18</p>
              </article>
              <article className="rounded-xl border border-cyan-300/20 bg-slate-800/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active</p>
                <p className="mt-1 text-xl font-black text-emerald-200">12</p>
              </article>
            </div>

            <div className="mt-3 space-y-2">
              {['Living Room', 'Kitchen', 'Bedroom'].map((room) => (
                <div className="flex items-center justify-between rounded-lg border border-cyan-300/10 bg-slate-800/50 px-3 py-2" key={room}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">{room}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">3 devices</span>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-cyan-300/10 bg-slate-800/50 p-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-400">AUTOMATIONS</span>
                <span className="font-bold text-emerald-300">3 active rules</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-semibold text-cyan-300">Lights 7PM</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">AC 24°C</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="border-y border-cyan-200/8 bg-slate-900/30 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {highlights.map((item) => (
            <div className="text-center" key={item.label}>
              <p className={`${styles.statNumber} text-3xl font-black md:text-4xl`}>{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16" id="features">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Core Features</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Everything You Need to Manage Your Home</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Our platform integrates device control, room organization, and smart automations into one cohesive dashboard experience.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <article className={`${styles.featureCard} p-6`} key={feature.title}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-black text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-cyan-200/8 py-16" id="how-it-works">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Getting Started</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Up and Running in Minutes</h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds. No credit card, no setup fees — just your name, email, and a password.' },
              { step: '02', title: 'Add Your Houses & Rooms', desc: 'Register your properties and organize rooms within each house. Map your real spaces digitally.' },
              { step: '03', title: 'Connect & Control Devices', desc: 'Add devices to rooms, toggle them on/off, and set up automations — all from the dashboard.' },
            ].map((item) => (
              <div className="rounded-2xl border border-cyan-200/10 bg-slate-900/50 p-6" key={item.step}>
                <span className={`${styles.statNumber} text-4xl font-black`}>{item.step}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${styles.ctaSection} border-t border-cyan-200/8 py-16`}>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black text-white md:text-4xl">Ready to Make Your Home Smarter?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Join The Smart Home platform and start controlling your devices, organizing rooms, and automating your routines — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isAuthenticated ? (
              <Link
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                to="/houses"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                  to="/register"
                >
                  Get Started Free
                </Link>
                <Link
                  className="rounded-xl border border-cyan-200/30 bg-slate-900/60 px-6 py-3.5 text-sm font-bold text-cyan-100 transition hover:-translate-y-0.5"
                  to="/login"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-200/8 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-emerald-400">
              <svg className="h-3.5 w-3.5 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-400">The Smart Home</span>
          </div>
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} The Smart Home. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
