import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import Button from '../components/Button';

export const PublicLayout = () => {
  const { theme, toggleTheme } = useUIStore();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">SparkConnect</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                LoveBook
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-colors min-h-touch min-w-touch flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {!isAuthPage && (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Join Free
                  </Button>
                </Link>
              </>
            )}

            {location.pathname === '/login' && (
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Create Account
                </Button>
              </Link>
            )}

            {location.pathname === '/signup' && (
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-900 py-8 px-4 sm:px-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SparkConnect • LoveBook Discovery Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="text-[11px] text-pink-400/80 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              18+ Adults Only
            </span>
            <Link to="/verify-id" className="hover:text-pink-400 transition-colors">
              ID Safety Check
            </Link>
            <Link to="/login" className="hover:text-pink-400 transition-colors">
              Member Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
