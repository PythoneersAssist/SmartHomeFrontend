import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../services/api';
import styles from './LoginPage.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await backendApi.forgotPassword(email.trim());
      // The backend always returns a neutral response (no account enumeration),
      // so we always show the same confirmation regardless of input.
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`${styles.pageShell} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8`}>
      <div className={`${styles.orb} -left-16 -top-16`} />
      <div className={`${styles.orb} -bottom-20 -right-16`} />

      <section className={`${styles.formCard} relative z-10 w-full max-w-md p-7`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">The Smart Home</p>
        <h1 className="mt-2 text-3xl font-black text-white">Forgot Password</h1>

        {sent ? (
          <>
            <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/12 px-3 py-3 text-sm text-emerald-100">
              If an account with that email exists, a password reset link has been sent. Please check your inbox.
            </p>
            <p className="mt-4 text-sm text-slate-300">
              <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/login">
                Back to login
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-300">
              Enter the email associated with your account and we'll send you a link to reset your password.
            </p>

            {error ? <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1 text-sm font-semibold text-slate-200">
                Email
                <input
                  className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <button className="mt-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-3 py-2 font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={submitting} type="submit">
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-300">
              Remembered it?{' '}
              <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/login">
                Back to login
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
