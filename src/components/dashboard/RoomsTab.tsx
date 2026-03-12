import type { FormEvent } from 'react';
import type { Device, Room } from '../../types/domain';
import { FLOOR_CHOICES } from '../../types/domain';
import type { RoomFormState } from './types';
import styles from './dashboard.module.css';

type Props = {
  rooms: Room[];
  devices: Device[];
  roomForm: RoomFormState;
  onRoomFormChange: (form: RoomFormState) => void;
  onCreateRoom: (e: FormEvent<HTMLFormElement>) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  submitting: boolean;
};

export function RoomsTab({ rooms, devices, roomForm, onRoomFormChange, onCreateRoom, onEditRoom, onDeleteRoom, submitting }: Props) {
  return (
    <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
      {/* Add Room Form */}
      <form className="rounded-2xl border border-cyan-200/10 bg-slate-900/50 p-5" onSubmit={onCreateRoom}>
        <h2 className="text-lg font-extrabold text-white">Add Room</h2>
        <p className="mb-4 mt-1 text-sm text-slate-400">New rooms are automatically linked to this house.</p>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
            Room Name
            <input
              className={styles.formInput}
              onChange={(e) => onRoomFormChange({ ...roomForm, name: e.target.value })}
              placeholder="e.g. Living Room"
              required
              value={roomForm.name}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
            Floor
            <select
              className={styles.formInput}
              onChange={(e) => onRoomFormChange({ ...roomForm, floor: e.target.value })}
              required
              value={roomForm.floor}
            >
              {FLOOR_CHOICES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <button
            className="mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 font-bold text-slate-900 transition hover:-translate-y-0.5"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Adding...' : 'Add Room'}
          </button>
        </div>
      </form>

      {/* Room List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {rooms.map((room) => (
          <div className={`${styles.roomCard} p-4`} key={room.id}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/12">
                <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{room.name}</p>
                <p className="text-xs text-slate-400">{room.floor} &middot; {devices.filter((d) => d.room_id === room.id).length} devices</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg border border-cyan-200/20 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/40"
                onClick={() => onEditRoom(room)}
                type="button"
              >
                Edit
              </button>
              <button
                className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                onClick={() => onDeleteRoom(room)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-cyan-500/15 p-8 text-center text-sm text-slate-500">
            No rooms linked to this house yet.
          </p>
        )}
      </div>
    </section>
  );
}
