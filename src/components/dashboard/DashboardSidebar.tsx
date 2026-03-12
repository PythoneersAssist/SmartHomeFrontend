import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardTab } from './types';
import styles from './dashboard.module.css';

type Props = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  houseName: string;
  username?: string;
  onLogout: () => void;
};

export type NavItem = { id: DashboardTab; label: string; icon: ReactNode };

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'rooms',
    label: 'Rooms',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'automations',
    label: 'Automations',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function DashboardSidebar({ activeTab, onTabChange, houseName, username, onLogout }: Props) {
  return (
    <aside className={`${styles.sidebar} hidden w-60 flex-col md:flex`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400">
          <svg className="h-4.5 w-4.5 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Smart Home</p>
          <p className="text-[11px] text-slate-500 truncate max-w-[130px]">{houseName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            className={`${styles.navItem} ${activeTab === item.id ? styles.navActive : ''} flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm`}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            type="button"
          >
            <span className={activeTab === item.id ? 'text-cyan-300' : 'text-slate-500'}>{item.icon}</span>
            <span className={activeTab === item.id ? 'font-semibold text-cyan-200' : 'text-slate-400'}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-cyan-500/10 px-4 py-4 space-y-2">
        <Link className="block text-sm text-slate-400 transition hover:text-cyan-300" to="/houses">
          &larr; All Houses
        </Link>
        <Link className="block text-sm text-slate-400 transition hover:text-cyan-300" to="/profile">
          Profile
        </Link>
        <button
          className="block text-sm text-slate-500 transition hover:text-rose-400"
          onClick={onLogout}
          type="button"
        >
          Logout {username ? `(${username})` : ''}
        </button>
      </div>
    </aside>
  );
}
