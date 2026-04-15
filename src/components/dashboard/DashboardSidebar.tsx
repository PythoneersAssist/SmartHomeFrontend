import { Link } from 'react-router-dom';
import type { DashboardTab } from './types';
import { NAV_ITEMS } from './navItems';
import styles from './dashboard.module.css';

type Props = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  houseName: string;
  username?: string;
  onLogout: () => void;
};

export function DashboardSidebar({ activeTab, onTabChange, houseName, username, onLogout }: Props) {
  return (
    <aside className={`${styles.sidebar} hidden w-60 flex-col md:flex`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-lime-300">
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
            <span className={activeTab === item.id ? 'text-emerald-300' : 'text-slate-500'}>{item.icon}</span>
            <span className={activeTab === item.id ? 'font-semibold text-emerald-200' : 'text-slate-400'}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 px-4 py-4 space-y-2">
        <Link className="block text-sm text-slate-400 transition hover:text-emerald-300" to="/houses">
          &larr; All Houses
        </Link>
        <Link className="block text-sm text-slate-400 transition hover:text-emerald-300" to="/profile">
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
