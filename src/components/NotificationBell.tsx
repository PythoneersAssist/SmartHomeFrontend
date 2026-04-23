import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { backendApi } from '../services/api';
import { localData } from '../services/storage';

type UiNotification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type ToastNotification = UiNotification & {
  exiting?: boolean;
};

type RealtimeEventPayload = {
  event?: string;
  timestamp?: string;
  notificationId?: string;
  deviceId?: string;
  status?: string;
  automationId?: string;
  automationName?: string;
  triggerType?: string | number | null;
  triggerValue?: string | number | null;
  reason?: string;
  action?: string;
};

function buildNotificationsWebSocketUrl(token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/api/notifications/ws?token=${encodeURIComponent(token)}`;
}

function makeNotification(
  payload: RealtimeEventPayload,
  getDeviceName: (deviceId: string | undefined) => string,
): UiNotification | null {
  const createdAt = payload.timestamp ?? new Date().toISOString();

  if (payload.event === 'deviceStatusChanged') {
    const deviceName = getDeviceName(payload.deviceId);
    const isOn = payload.status === 'on';
    return {
      id: payload.notificationId ?? `${createdAt}-device-${payload.deviceId ?? 'unknown'}`,
      title: isOn ? 'Device turned on' : 'Device turned off',
      message: `${deviceName} is now ${isOn ? 'ON' : 'OFF'}.`,
      is_read: false,
      created_at: createdAt,
    };
  }

  if (payload.event === 'automationTriggered') {
    const deviceName = getDeviceName(payload.deviceId);
    const triggerText = payload.triggerValue !== null && payload.triggerValue !== undefined
      ? ` (trigger: ${payload.triggerValue})`
      : '';
    return {
      id: payload.notificationId ?? `${createdAt}-automation-trigger-${payload.automationId ?? 'unknown'}`,
      title: 'Automation triggered',
      message: `${payload.automationName ?? 'Automation'} executed for ${deviceName}${triggerText}.`,
      is_read: false,
      created_at: createdAt,
    };
  }

  if (payload.event === 'automationChanged') {
    const actionLabel = payload.action ?? 'updated';
    return {
      id: payload.notificationId ?? `${createdAt}-automation-change-${payload.automationId ?? 'unknown'}`,
      title: `Automation ${actionLabel}`,
      message: `${payload.automationName ?? 'Automation'} was ${actionLabel}.`,
      is_read: false,
      created_at: createdAt,
    };
  }

  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const deviceNamesRef = useRef<Record<string, string>>({});
  const swipeRef = useRef<{ id: string; pointerId: number; startX: number } | null>(null);
  const toastTimersRef = useRef<Record<string, { exit: number; remove: number }>>({});

  const unreadCount = useMemo(
    () => notifications.reduce((acc, item) => acc + (item.is_read ? 0 : 1), 0),
    [notifications],
  );

  useEffect(() => {
    let active = true;

    async function loadDeviceNames() {
      try {
        const devices = await backendApi.getDevices();
        if (!active) {
          return;
        }

        const nextMap: Record<string, string> = {};
        for (const device of devices) {
          nextMap[device.id] = device.name;
        }
        deviceNamesRef.current = nextMap;
      } catch {
        // If fetching devices fails, realtime notifications will still render with a generic label.
      }
    }

    async function loadStoredNotifications() {
      try {
        const stored = await backendApi.getNotifications();
        if (!active) {
          return;
        }
        setNotifications(stored.slice(0, 60));
      } catch {
        // If fetching notification history fails, realtime notifications will still work.
      }
    }

    void loadDeviceNames();
    void loadStoredNotifications();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function clearToastTimers(notificationId: string) {
      const timers = toastTimersRef.current[notificationId];
      if (!timers) {
        return;
      }
      window.clearTimeout(timers.exit);
      window.clearTimeout(timers.remove);
      delete toastTimersRef.current[notificationId];
    }

    function removeToast(notificationId: string) {
      setToastNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      clearToastTimers(notificationId);
    }

    function pushToast(notification: UiNotification) {
      removeToast(notification.id);
      setToastNotifications((prev) => [{ ...notification, exiting: false }, ...prev].slice(0, 3));

      const exitTimer = window.setTimeout(() => {
        setToastNotifications((prev) => prev.map((item) => (
          item.id === notification.id ? { ...item, exiting: true } : item
        )));
      }, 2200);

      const removeTimer = window.setTimeout(() => {
        removeToast(notification.id);
      }, 2800);

      toastTimersRef.current[notification.id] = {
        exit: exitTimer,
        remove: removeTimer,
      };
    }

    const token = localData.getSession()?.accessToken;
    if (!token) {
      return;
    }

    let socket: WebSocket | null = null;
    let pingInterval: number | null = null;
    let reconnectTimeout: number | null = null;
    let closedByEffect = false;
    let reconnectAttempts = 0;

    const cleanupTimers = () => {
      if (pingInterval !== null) {
        window.clearInterval(pingInterval);
      }
      if (reconnectTimeout !== null) {
        window.clearTimeout(reconnectTimeout);
      }
      pingInterval = null;
      reconnectTimeout = null;
    };

    const connect = () => {
      if (closedByEffect) {
        return;
      }

      socket = new WebSocket(buildNotificationsWebSocketUrl(token));

      socket.onopen = () => {
        reconnectAttempts = 0;
        pingInterval = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 25_000);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as RealtimeEventPayload;
          if (payload.event === 'connected' || payload.event === 'pong') {
            return;
          }

          const notification = makeNotification(payload, (deviceId) => {
            if (!deviceId) {
              return 'Unknown device';
            }
            return deviceNamesRef.current[deviceId] ?? 'Unknown device';
          });
          if (!notification) {
            return;
          }

          setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)].slice(0, 60));
          pushToast(notification);
        } catch {
          // ignore malformed realtime payloads
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        cleanupTimers();
        if (closedByEffect) {
          return;
        }

        const delay = Math.min(10_000, 1_000 * (2 ** reconnectAttempts));
        reconnectAttempts += 1;
        reconnectTimeout = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      cleanupTimers();
      socket?.close();
      Object.values(toastTimersRef.current).forEach((timers) => {
        window.clearTimeout(timers.exit);
        window.clearTimeout(timers.remove);
      });
      toastTimersRef.current = {};
    };
  }, []);

  function removeNotification(notificationId: string) {
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    setSwipeOffsets((prev) => {
      if (!(notificationId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[notificationId];
      return next;
    });
    setToastNotifications((prev) => prev.filter((item) => item.id !== notificationId));

    const timers = toastTimersRef.current[notificationId];
    if (timers) {
      window.clearTimeout(timers.exit);
      window.clearTimeout(timers.remove);
      delete toastTimersRef.current[notificationId];
    }

    void backendApi.deleteNotification(notificationId).catch(() => undefined);
  }

  function handleSwipeStart(event: React.PointerEvent<HTMLDivElement>, notificationId: string) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    swipeRef.current = {
      id: notificationId,
      pointerId: event.pointerId,
      startX: event.clientX,
    };
    setActiveSwipeId(notificationId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSwipeMove(event: React.PointerEvent<HTMLDivElement>, notificationId: string) {
    const activeSwipe = swipeRef.current;
    if (!activeSwipe || activeSwipe.id !== notificationId || activeSwipe.pointerId !== event.pointerId) {
      return;
    }

    const rawOffset = event.clientX - activeSwipe.startX;
    const clampedOffset = Math.max(-140, Math.min(0, rawOffset));
    setSwipeOffsets((prev) => {
      if (prev[notificationId] === clampedOffset) {
        return prev;
      }
      return {
        ...prev,
        [notificationId]: clampedOffset,
      };
    });
  }

  function handleSwipeEnd(event: React.PointerEvent<HTMLDivElement>, notificationId: string) {
    const activeSwipe = swipeRef.current;
    if (!activeSwipe || activeSwipe.id !== notificationId || activeSwipe.pointerId !== event.pointerId) {
      return;
    }

    const rawOffset = event.clientX - activeSwipe.startX;
    const clampedOffset = Math.max(-140, Math.min(0, rawOffset));
    const shouldDelete = clampedOffset <= -90;

    if (shouldDelete) {
      removeNotification(notificationId);
    } else {
      setSwipeOffsets((prev) => ({
        ...prev,
        [notificationId]: 0,
      }));
    }

    swipeRef.current = null;
    setActiveSwipeId(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // Close on click-outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePanelPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const panelWidth = 320;
      const viewportPadding = 12;
      const left = Math.max(
        viewportPadding,
        Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - viewportPadding),
      );
      const top = rect.bottom + 10;

      setPanelPosition({ top, left });
    }

    updatePanelPosition();

    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open]);

  function handleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
        void backendApi.markAllNotificationsRead().catch(() => undefined);
      }
      return next;
    });
  }

  return (
    <div className="relative" ref={triggerRef}>
      {/* Bell Button */}
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 transition hover:bg-emerald-500/25"
        onClick={handleOpen}
        type="button"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && createPortal(
        <div
          className="fixed z-[2200] w-80 rounded-2xl border border-white/12 bg-[#0b0f14] shadow-2xl"
          ref={dropdownRef}
          style={{ top: panelPosition.top, left: panelPosition.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <span className="text-[11px] text-slate-500">Swipe left to delete</span>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div className="relative border-b border-white/10" key={n.id}>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold uppercase tracking-wider text-rose-300/80">
                    Swipe to delete
                  </div>

                  <div
                    className={`flex items-start gap-3 px-4 py-3 ${n.is_read ? 'opacity-60' : 'bg-emerald-500/8'}`}
                    onPointerCancel={(event) => handleSwipeEnd(event, n.id)}
                    onPointerDown={(event) => handleSwipeStart(event, n.id)}
                    onPointerMove={(event) => handleSwipeMove(event, n.id)}
                    onPointerUp={(event) => handleSwipeEnd(event, n.id)}
                    style={{
                      transform: `translateX(${swipeOffsets[n.id] ?? 0}px)`,
                      transition: activeSwipeId === n.id ? 'none' : 'transform 0.18s ease',
                      touchAction: 'pan-y',
                    }}
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <span
                        className={`block h-2 w-2 rounded-full ${n.is_read ? 'bg-slate-600' : 'bg-emerald-400'}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}

      {!open && toastNotifications.length > 0 && createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[2300] w-[320px] space-y-2">
          {toastNotifications.map((n) => (
            <div
              className={`rounded-xl border border-white/12 bg-[#0b0f14]/96 px-3 py-2 shadow-2xl transition-all duration-300 ${n.exiting ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100 animate-[slideIn_0.24s_ease-out]'}`}
              key={`toast-${n.id}`}
            >
              <p className="text-xs font-semibold text-white truncate">{n.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-300 line-clamp-2">{n.message}</p>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
