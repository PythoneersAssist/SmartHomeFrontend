import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register({ username, email, password });
      navigate('/houses');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`${styles.pageShell} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8`}>
      <div className={`${styles.orb} -left-16 -top-16`} />
      <div className={`${styles.orb} -bottom-20 -right-16`} />

      <section className={`${styles.formCard} relative z-10 w-full max-w-md p-7`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Create Account</p>
        <h1 className="mt-2 text-3xl font-black text-white">Start Your Smart Home</h1>

        {error ? <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm font-semibold text-slate-200">
            Username
            <input
              className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
              required
              value={username}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-200">
            Email
            <input
              className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-200">
            Password
            <input
              className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button className="mt-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-3 py-2 font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={submitting} type="submit">
            {submitting ? 'Creating account…' : 'Register Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Already have an account?{' '}
          <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/login">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
