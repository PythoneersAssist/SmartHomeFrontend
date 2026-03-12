import type { Device, Room } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import { getDeviceTypeIcon } from './deviceIcons';
import styles from './dashboard.module.css';

type Props = {
  rooms: Room[];
  devices: Device[];
  roomMap: Map<string, Room>;
  expandedRoomId: string | null;
  onExpandRoom: (roomId: string | null) => void;
  onToggleDevice: (device: Device) => void;
  submitting: boolean;
};

export function OverviewTab({ rooms, devices, roomMap, expandedRoomId, onExpandRoom, onToggleDevice, submitting }: Props) {
  const activeDeviceCount = devices.filter((d) => Boolean(d.parameters?.status)).length;

  return (
    <>
      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-2">
        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Devices</p>
              <p className="text-2xl font-black text-white">{activeDeviceCount} <span className="text-sm font-semibold text-slate-400">/ {devices.length}</span></p>
            </div>
          </div>
        </article>

        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <svg className="h-5 w-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rooms</p>
              <p className="text-2xl font-black text-white">{rooms.length}</p>
            </div>
          </div>
        </article>
      </section>

      {/* Main Rooms */}
      <section className="mt-6">
        <p className={styles.sectionTitle}>Main Rooms</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const roomDevices = devices.filter((d) => d.room_id === room.id);
            const isExpanded = expandedRoomId === room.id;
            return (
              <div key={room.id}>
                <button
                  className={`${styles.roomCard} w-full p-4 text-left ${isExpanded ? 'ring-1 ring-cyan-400/40' : ''}`}
                  onClick={() => onExpandRoom(isExpanded ? null : room.id)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/12">
                      <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{room.name}</p>
                      <p className="text-xs text-slate-400">{roomDevices.length} Devices &middot; {room.floor}</p>
                    </div>
                    <svg
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Drill-down: devices in this room */}
                {isExpanded && (
                  <div className="mt-2 grid gap-2 pl-2 animate-[fadeInUp_0.2s_ease-out] sm:grid-cols-2">
                    {roomDevices.length === 0 ? (
                      <p className="col-span-full rounded-lg border border-dashed border-cyan-500/10 p-3 text-center text-xs text-slate-500">
                        No devices in this room.
                      </p>
                    ) : roomDevices.map((device) => {
                      const isOn = Boolean(device.parameters?.status);
                      return (
                        <div className={`${styles.deviceCard} ${isOn ? styles.deviceCardOn : ''} p-3`} key={device.id}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-white">{device.name}</p>
                              <p className="text-[11px] text-slate-400">{DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'}</p>
                            </div>
                            <button
                              className="focus:outline-none"
                              disabled={submitting}
                              onClick={() => onToggleDevice(device)}
                              type="button"
                            >
                              <div className={`${styles.toggleTrack} ${isOn ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
                                <div className={`${styles.toggleKnob} ${isOn ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
                              </div>
                            </button>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${isOn ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className={`text-[11px] font-semibold ${isOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {isOn ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {rooms.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-cyan-500/15 p-6 text-center text-sm text-slate-500">
              No rooms yet. Go to the Rooms tab to add one.
            </p>
          )}
        </div>
      </section>

      {/* Active Devices */}
      <section className="mt-6">
        <p className={styles.sectionTitle}>Active Devices</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {devices.map((device) => {
            const isOn = Boolean(device.parameters?.status);
            return (
              <div className={`${styles.deviceCard} ${isOn ? styles.deviceCardOn : ''} p-4`} key={device.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{device.name}</p>
                    <p className="text-xs text-slate-400">{DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'}</p>
                  </div>
                  {getDeviceTypeIcon(device.type)}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Room</p>
                    <p className="text-sm font-bold text-slate-300">{roomMap.get(device.room_id)?.name ?? '—'}</p>
                  </div>
                  <button
                    className="focus:outline-none"
                    disabled={submitting}
                    onClick={() => onToggleDevice(device)}
                    type="button"
                  >
                    <div className={`${styles.toggleTrack} ${isOn ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
                      <div className={`${styles.toggleKnob} ${isOn ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
                    </div>
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isOn ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={`text-xs font-semibold ${isOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOn ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            );
          })}
          {devices.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-cyan-500/15 p-6 text-center text-sm text-slate-500">
              No devices yet. Go to the Devices tab to add one.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
