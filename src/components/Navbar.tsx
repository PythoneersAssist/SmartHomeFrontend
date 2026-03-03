import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-dark-900/70 border-b border-dark-700/50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow duration-300">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
            SmartHome
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-5 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-200 font-medium text-sm border border-dark-600/50 hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-medium text-sm shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
