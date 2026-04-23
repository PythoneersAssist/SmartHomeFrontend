import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useHouseStore } from '../contexts/HouseContext';
import { useToast } from '../contexts/ToastContext';
import type { House } from '../types/domain';
import styles from './HousesPage.module.css';

type HouseFormState = {
  name: string;
  description: string;
};

const initialForm: HouseFormState = {
  name: '',
  description: '',
};

export function HousesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { houses, createHouse, updateHouse, deleteHouse } = useHouseStore();
  const { addToast } = useToast();

  const [form, setForm] = useState<HouseFormState>(initialForm);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [deletingHouse, setDeletingHouse] = useState<House | null>(null);
  const [creatingHouse, setCreatingHouse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createHouse(form);
      setForm(initialForm);
      addToast('House created successfully');
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create house');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingHouse) return;

    setError(null);
    setSubmitting(true);

    try {
      await updateHouse(editingHouse.id, {
        name: editingHouse.name,
        description: editingHouse.description,
      });
      setEditingHouse(null);
      addToast('House updated successfully');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update house');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(houseId: string) {
    setError(null);
    try {
      await deleteHouse(houseId);
      addToast('House deleted');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete house');
    }
  }

  return (
    <main className="appShellBackground relative min-h-screen px-4 py-6">
      <div className={styles.pageGlow} />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-5">
        {/* Header */}
        <header className={`${styles.topCard} flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5 backdrop-blur`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">The Smart Home</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Your Houses</h1>
            <p className="mt-1 text-sm text-slate-400">Select a house to open its dashboard, or create a new one.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/45"
              to="/"
            >
              Home
            </Link>
            <Link
              className="rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/45"
              to="/profile"
            >
              Profile
            </Link>
            <button
              className="rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-rose-300"
              onClick={() => { logout(); navigate('/login'); }}
              type="button"
            >
              Logout {user ? `(${user.username})` : ''}
            </button>
          </div>
        </header>

        {error ? <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p> : null}

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Houses</p>
          <button
            aria-label="Add house"
            className={styles.addAction}
            onClick={() => {
              setForm(initialForm);
              setCreatingHouse(true);
            }}
            type="button"
          >
            +
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          {houses.length === 0 ? (
            <article className="col-span-full rounded-2xl border border-dashed border-white/15 bg-slate-900/30 p-8 text-center text-slate-500">
              <svg className="mx-auto h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="mt-3 font-semibold">No houses yet</p>
              <p className="mt-1 text-sm">Create your first house using the + button.</p>
            </article>
          ) : null}

          {houses.map((house) => (
            <article
              className={`${styles.houseCard} p-5`}
              key={house.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">House</p>
                  <h3 className="mt-1 text-xl font-extrabold text-white">{house.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{house.description}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-gradient-to-r from-emerald-400 to-lime-300 px-3.5 py-2 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5"
                  onClick={() => navigate(`/houses/${house.id}`)}
                  type="button"
                >
                  Enter
                </button>
                <button
                  className="rounded-lg border border-white/15 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/45"
                  onClick={() => setEditingHouse(house)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
                  onClick={() => setDeletingHouse(house)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Create modal */}
      {creatingHouse ? (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form
            className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl`}
            onSubmit={async (event) => {
              const created = await handleCreate(event);
              if (created) {
                setCreatingHouse(false);
              }
            }}
          >
            <h3 className="text-xl font-extrabold text-white">Add New House</h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">Each house has its own room mapping and controls.</p>

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                House Name
                <input
                  className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Main Residence"
                  required
                  value={form.name}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Description
                <input
                  className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional description"
                  value={form.description}
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Creating...' : 'Create House'}
              </button>
              <button
                className="rounded-xl border border-white/20 bg-black/35 px-4 py-2.5 text-sm font-semibold text-slate-300"
                onClick={() => setCreatingHouse(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Edit modal */}
      {editingHouse ? (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl`} onSubmit={handleUpdate}>
            <h3 className="text-xl font-extrabold text-white">Update House</h3>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                House Name
                <input
                  className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) =>
                    setEditingHouse((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  required
                  value={editingHouse.name}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Description
                <input
                  className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-white focus:border-emerald-300/70 focus:outline-none"
                  onChange={(event) =>
                    setEditingHouse((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                  }
                  value={editingHouse.description}
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900" type="submit">
                Save Changes
              </button>
              <button
                className="rounded-xl border border-white/20 bg-black/35 px-4 py-2.5 text-sm font-semibold text-slate-300"
                onClick={() => setEditingHouse(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <ConfirmDialog
        open={deletingHouse !== null}
        title="Delete House"
        message={`Are you sure you want to delete "${deletingHouse?.name}"? All rooms and devices inside it will be lost.`}
        onConfirm={() => {
          if (deletingHouse) {
            void handleDelete(deletingHouse.id);
          }
          setDeletingHouse(null);
        }}
        onCancel={() => setDeletingHouse(null)}
      />
    </main>
  );
}
