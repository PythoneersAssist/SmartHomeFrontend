import { Link } from 'react-router-dom';
import type { DashboardTab } from './types';
import { NAV_ITEMS } from './DashboardSidebar';
import styles from './dashboard.module.css';

type Props = {
  open: boolean;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  houseName: string;
  onClose: () => void;
  onLogout: () => void;
};

export function MobileDrawer({ open, activeTab, onTabChange, houseName, onClose, onLogout }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0d1b2a] border-r border-cyan-500/10 flex flex-col animate-[slideInLeft_0.2s_ease-out]">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
              <svg className="h-4.5 w-4.5 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Smart Home</p>
              <p className="text-[11px] text-slate-500 truncate max-w-[120px]">{houseName}</p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white transition"
            onClick={onClose}
            type="button"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              className={`${styles.navItem} ${activeTab === item.id ? styles.navActive : ''} flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm`}
              key={item.id}
              onClick={() => { onTabChange(item.id); onClose(); }}
              type="button"
            >
              <span className={activeTab === item.id ? 'text-cyan-300' : 'text-slate-500'}>{item.icon}</span>
              <span className={activeTab === item.id ? 'font-semibold text-cyan-200' : 'text-slate-400'}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="border-t border-cyan-500/10 px-4 py-4 space-y-2">
          <Link className="block text-sm text-slate-400 transition hover:text-cyan-300" to="/houses" onClick={onClose}>
            &larr; All Houses
          </Link>
          <Link className="block text-sm text-slate-400 transition hover:text-cyan-300" to="/profile" onClick={onClose}>
            Profile
          </Link>
          <button
            className="block text-sm text-slate-500 transition hover:text-rose-400"
            onClick={onLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}
