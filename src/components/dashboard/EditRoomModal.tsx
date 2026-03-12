import type { FormEvent } from 'react';
import type { Room } from '../../types/domain';
import { FLOOR_CHOICES } from '../../types/domain';
import styles from './dashboard.module.css';

type Props = {
  room: Room;
  onChange: (room: Room) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function EditRoomModal({ room, onChange, onSubmit, onClose }: Props) {
  return (
    <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
      <form className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl`} onSubmit={onSubmit}>
        <h3 className="text-xl font-extrabold text-white">Update Room</h3>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
            Name
            <input
              className={styles.formInput}
              onChange={(e) => onChange({ ...room, name: e.target.value })}
              value={room.name}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
            Floor
            <select
              className={styles.formInput}
              onChange={(e) => onChange({ ...room, floor: e.target.value })}
              value={room.floor}
            >
              {FLOOR_CHOICES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900" type="submit">
            Save
          </button>
          <button
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
