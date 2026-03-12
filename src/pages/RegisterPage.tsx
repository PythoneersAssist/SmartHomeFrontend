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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className={`${styles.orb} -left-16 -top-16`} />
      <div className={`${styles.orb} -bottom-20 -right-16`} />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-200/20 bg-slate-900/75 p-7 shadow-2xl backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Create Account</p>
        <h1 className="mt-2 text-3xl font-black text-white">Start Your Smart Home</h1>

        {error ? <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm font-semibold text-cyan-100">
            Username
            <input
              className="rounded-xl border border-cyan-300/30 bg-slate-950/70 px-3 py-2 text-white focus:border-cyan-200 focus:outline-none"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
              required
              value={username}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-cyan-100">
            Email
            <input
              className="rounded-xl border border-cyan-300/30 bg-slate-950/70 px-3 py-2 text-white focus:border-cyan-200 focus:outline-none"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-cyan-100">
            Password
            <input
              className="rounded-xl border border-cyan-300/30 bg-slate-950/70 px-3 py-2 text-white focus:border-cyan-200 focus:outline-none"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-2 font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={submitting} type="submit">
            {submitting ? 'Creating account…' : 'Register Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-cyan-100">
          Already have an account?{' '}
          <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/login">
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
