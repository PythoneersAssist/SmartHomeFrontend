import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { backendApi } from '../services/api';
import { validatePassword } from '../types/domain';
import styles from './LoginPage.module.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const rulesError = validatePassword(password);
    if (rulesError) {
      setError(rulesError);
      return;
    }

    setSubmitting(true);
    try {
      await backendApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to reset password.');
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
        <h1 className="mt-2 text-3xl font-black text-white">Reset Password</h1>

        {!token ? (
          <>
            <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
              This reset link is missing its token. Please use the link from your email, or request a new one.
            </p>
            <p className="mt-4 text-sm text-slate-300">
              <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/forgot-password">
                Request a new link
              </Link>
            </p>
          </>
        ) : done ? (
          <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/12 px-3 py-3 text-sm text-emerald-100">
            Password has been reset successfully. Redirecting you to login…
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-300">Choose a new password for your account.</p>

            {error ? <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-1 text-sm font-semibold text-slate-200">
                New Password
                <input
                  className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your new password"
                  required
                  type="password"
                  value={password}
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-200">
                Confirm Password
                <input
                  className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>

              <p className="text-xs text-slate-500">
                Must be 8–72 characters and include an uppercase letter, a lowercase letter, a digit, and a symbol.
              </p>

              <button className="mt-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-3 py-2 font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={submitting} type="submit">
                {submitting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-300">
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
