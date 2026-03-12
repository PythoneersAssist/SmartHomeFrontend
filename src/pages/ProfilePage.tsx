import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { backendApi } from '../services/api';
import styles from './ProfilePage.module.css';

type ProfileData = {
  id: string;
  username: string;
  email: string;
  registered_at: string;
};

export function ProfilePage() {
  const { logout } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [editField, setEditField] = useState<'username' | 'email' | 'password' | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    backendApi
      .getMe()
      .then((data) => setProfile({ id: data.id, username: data.username, email: data.email, registered_at: data.registered_at }))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  function openEdit(field: 'username' | 'email' | 'password') {
    setEditField(field);
    setFieldValue(field === 'password' ? '' : (profile?.[field] ?? ''));
    setConfirmPassword('');
    setError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !editField) return;

    if (editField === 'password' && fieldValue !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await backendApi.updateUser({
        id: profile.id,
        [editField]: fieldValue,
      });

      // Refresh profile
      const data = await backendApi.getMe();
      setProfile({ id: data.id, username: data.username, email: data.email, registered_at: data.registered_at });
      setEditField(null);
      addToast(`${editField.charAt(0).toUpperCase() + editField.slice(1)} updated successfully`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  const registered = profile?.registered_at
    ? new Date(profile.registered_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <main className="relative min-h-screen bg-[#060d19] px-4 py-6">
      <div className={styles.pageGlow} />

      <div className="relative z-10 mx-auto w-full max-w-2xl space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-cyan-200/10 bg-slate-900/50 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">The Smart Home</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Profile</h1>
            <p className="mt-1 text-sm text-slate-400">View and update your account details.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-cyan-200/20 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-200/40"
              to="/houses"
            >
              &larr; Houses
            </Link>
            <button
              className="rounded-xl border border-cyan-200/20 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-rose-300"
              onClick={() => logout()}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        {error && !editField ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : profile ? (
          <>
            {/* Avatar + name */}
            <section className={`${styles.card} flex items-center gap-5 p-6`}>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400">
                <span className="text-2xl font-black text-slate-950">
                  {profile.username?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">{profile.username}</h2>
                <p className="text-sm text-slate-400">{profile.email}</p>
                <p className="mt-1 text-xs text-slate-500">Member since {registered}</p>
              </div>
            </section>

            {/* Info rows */}
            <section className={`${styles.card} divide-y divide-cyan-500/10 p-0 overflow-hidden`}>
              {/* Username row */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Username</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{profile.username}</p>
                </div>
                <button
                  className="rounded-lg border border-cyan-200/20 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/40"
                  onClick={() => openEdit('username')}
                  type="button"
                >
                  Edit
                </button>
              </div>

              {/* Email row */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{profile.email}</p>
                </div>
                <button
                  className="rounded-lg border border-cyan-200/20 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/40"
                  onClick={() => openEdit('email')}
                  type="button"
                >
                  Edit
                </button>
              </div>

              {/* Password row */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</p>
                  <p className="mt-0.5 text-sm text-slate-500">••••••••</p>
                </div>
                <button
                  className="rounded-lg border border-cyan-200/20 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/40"
                  onClick={() => openEdit('password')}
                  type="button"
                >
                  Change
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {/* Edit modal */}
      {editField ? (
        <section className="fixed inset-0 z-20 grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
          <form
            className="w-full max-w-md rounded-2xl border border-cyan-200/10 bg-slate-900/95 p-6 shadow-2xl"
            onSubmit={handleSave}
          >
            <h3 className="text-xl font-extrabold text-white">
              {editField === 'password' ? 'Change Password' : `Edit ${editField.charAt(0).toUpperCase() + editField.slice(1)}`}
            </h3>

            {error ? (
              <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
            ) : null}

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                {editField === 'password' ? 'New Password' : editField.charAt(0).toUpperCase() + editField.slice(1)}
                <input
                  autoFocus
                  className={styles.formInput}
                  onChange={(e) => setFieldValue(e.target.value)}
                  required
                  type={editField === 'password' ? 'password' : editField === 'email' ? 'email' : 'text'}
                  value={fieldValue}
                />
              </label>

              {editField === 'password' ? (
                <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                  Confirm Password
                  <input
                    className={styles.formInput}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>
              ) : null}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
              <button
                className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300"
                onClick={() => { setEditField(null); setError(null); }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </main>
  );
}
