import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
};

export function AppHeader({ title, subtitle, backTo }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="rounded-2xl border border-cyan-200/10 bg-slate-900/50 p-5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Smart Living Control</p>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          {backTo ? (
            <Link
              className="rounded-xl border border-cyan-200/20 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-200/40"
              to={backTo}
            >
              Back
            </Link>
          ) : null}

          <button
            className="rounded-xl border border-cyan-200/20 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-rose-300"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            type="button"
          >
            Logout {user ? `(${user.username})` : ''}
          </button>
        </div>
      </div>
    </header>
  );
}
