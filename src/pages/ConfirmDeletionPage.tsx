import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { backendApi } from '../services/api';
import styles from './LoginPage.module.css';

export function ConfirmDeletionPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);

    try {
      await backendApi.confirmAccountDeletion(token);
      // The account no longer exists and any stored JWT is now useless — clear
      // local auth state and treat the user as logged out.
      logout();
      setDone(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`${styles.pageShell} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8`}>
      <div className={`${styles.orb} -left-16 -top-16`} />
      <div className={`${styles.orb} -bottom-20 -right-16`} />

      <section className={`${styles.formCard} relative z-10 w-full max-w-md p-7`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">The Smart Home</p>
        <h1 className="mt-2 text-3xl font-black text-white">Delete Account</h1>

        {!token ? (
          <>
            <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
              This confirmation link is missing its token. Please use the link from your email.
            </p>
            <p className="mt-4 text-sm text-slate-300">
              <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/login">
                Back to login
              </Link>
            </p>
          </>
        ) : done ? (
          <>
            <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/12 px-3 py-3 text-sm text-emerald-100">
              Your account has been permanently deleted. We're sorry to see you go.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900"
                onClick={() => navigate('/register')}
                type="button"
              >
                Create a new account
              </button>
              <Link
                className="rounded-xl border border-white/20 bg-black/35 px-4 py-2.5 text-sm font-semibold text-slate-300"
                to="/"
              >
                Go home
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-300">
              This will <span className="font-bold text-rose-300">permanently delete</span> your account along with
              all of your houses, rooms, devices, automations, and notifications. This action cannot be undone.
            </p>

            {error ? <p className="mt-4 rounded-xl border border-rose-300/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                disabled={submitting}
                onClick={() => void handleConfirm()}
                type="button"
              >
                {submitting ? 'Deleting…' : 'Permanently delete my account'}
              </button>
              <Link
                className="rounded-xl border border-white/20 bg-black/35 px-4 py-2.5 text-sm font-semibold text-slate-300"
                to="/login"
              >
                Cancel
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
