import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/houses" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(username, password);
      navigate('/houses');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to login');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <section className={`${styles.gridGlow} w-full max-w-md rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-7 shadow-2xl backdrop-blur`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">The Smart Home</p>
        <h1 className="mt-2 text-3xl font-black text-white">Sign In To Continue</h1>
        <p className="mt-2 text-sm text-cyan-100/80">Only authenticated users can access houses, rooms, and device control.</p>

        {error ? <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm font-semibold text-cyan-100">
            Username or Email
            <input
              className="rounded-xl border border-cyan-300/30 bg-slate-950/70 px-3 py-2 text-white placeholder:text-slate-400 focus:border-cyan-200 focus:outline-none"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your username or email"
              required
              value={username}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-cyan-100">
            Password
            <input
              className="rounded-xl border border-cyan-300/30 bg-slate-950/70 px-3 py-2 text-white placeholder:text-slate-400 focus:border-cyan-200 focus:outline-none"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
              type="password"
              value={password}
            />
          </label>

          <button className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-2 font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={submitting} type="submit">
            {submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-cyan-100">
          No account yet?{' '}
          <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
