import { useCallback, useEffect, useRef, useState } from 'react';
import { backendApi } from '../services/api';
import type { Notification } from '../types/domain';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const resp = await backendApi.getUnreadCount();
      setUnreadCount(resp.unread_count);
    } catch {
      // silently ignore
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => void fetchUnreadCount(), 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close on click-outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const data = await backendApi.getNotifications();
        setNotifications(data);
        const count = data.filter((n) => !n.is_read).length;
        setUnreadCount(count);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await backendApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  }

  async function handleMarkAllRead() {
    try {
      await backendApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  }

  async function handleDelete(id: string) {
    const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
    try {
      await backendApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 transition hover:bg-cyan-500/25"
        onClick={() => void handleOpen()}
        type="button"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-cyan-200/15 bg-[#0d1b2a] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/10 px-4 py-3">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                onClick={() => void handleMarkAllRead()}
                type="button"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  className={`flex items-start gap-3 border-b border-cyan-500/5 px-4 py-3 transition ${
                    n.is_read ? 'opacity-60' : 'bg-cyan-500/5'
                  }`}
                  key={n.id}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <span
                      className={`block h-2 w-2 rounded-full ${n.is_read ? 'bg-slate-600' : 'bg-cyan-400'}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 gap-1">
                    {!n.is_read && (
                      <button
                        className="rounded p-1 text-slate-500 transition hover:text-cyan-300"
                        onClick={() => void handleMarkRead(n.id)}
                        title="Mark as read"
                        type="button"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="rounded p-1 text-slate-500 transition hover:text-rose-400"
                      onClick={() => void handleDelete(n.id)}
                      title="Delete"
                      type="button"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
