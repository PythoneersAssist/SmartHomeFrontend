import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Device, Room } from '../../types/domain';
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_GROUPS, getRoomTypeLabel } from '../../types/domain';
import type { RoomFormState } from './types';
import { getRoomTypeIcon } from './roomIcons';
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className={`${styles.sectionTitle} text-slate-300`}>Rooms</p>
          <button
            aria-label="Add room"
            className={styles.addAction}
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            +
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <div className={`${styles.roomCard} p-4`} key={room.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/12">
                  <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{room.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-emerald-300">{getRoomTypeIcon(room.room_type ?? DEFAULT_ROOM_TYPE)}</span>
                    <span>{getRoomTypeLabel(room.room_type)} &middot; {devices.filter((d) => d.room_id === room.id).length} devices</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-lg border border-white/15 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/45"
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
            <p className="col-span-full rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
              No rooms linked to this house yet.
            </p>
          )}
        </div>
      </section>

      {showCreateModal && (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form
            className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl`}
            onSubmit={(e) => {
              onCreateRoom(e);
              setShowCreateModal(false);
            }}
          >
            <h3 className="text-xl font-extrabold text-white">Add Room</h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">New rooms are automatically linked to this house.</p>

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Room Name
                <input
                  className={styles.formInput}
                  onChange={(e) => onRoomFormChange({ ...roomForm, name: e.target.value })}
                  placeholder="e.g. Living Room"
                  required
                  value={roomForm.name}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Room Type
                <select
                  className={styles.formInput}
                  onChange={(e) => onRoomFormChange({ ...roomForm, room_type: e.target.value })}
                  required
                  value={roomForm.room_type}
                >
                  {ROOM_TYPE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Adding...' : 'Add Room'}
              </button>
              <button
                className="rounded-xl border border-white/20 bg-black/35 px-4 py-2.5 text-sm font-semibold text-slate-300"
                onClick={() => setShowCreateModal(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
