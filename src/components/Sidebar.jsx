import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Flame,
  Compass,
  MapPin,
  MessageCircle,
  User,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useProfileStore } from '../store/profileStore';
import Avatar from './Avatar';
import ModeToggle from './ModeToggle';

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { mode, setMode } = useProfileStore();

  const navLinks = [
    { to: '/app', label: 'Match Feed', icon: Flame, end: true },
    { to: '/app/discover', label: 'Discover Grid', icon: Compass },
    { to: '/app/map', label: 'Spark Map (Live)', icon: MapPin },
    { to: '/app/chats', label: 'Conversations', icon: MessageCircle },
    { to: '/app/profile/me', label: 'My Profile', icon: User },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 shrink-0 bg-gray-950 border-r border-gray-800/80 p-5 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-800/80">
        <NavLink to="/app" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              SparkConnect
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400">
              LoveBook
            </span>
          </div>
        </NavLink>

        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-colors min-h-touch min-w-touch flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode Switcher Banner */}
      <div className="my-5">
        <ModeToggle mode={mode} onChange={setMode} showDescription={false} />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-3 pb-1">
          Explore
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 select-none min-h-touch
                ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-400 border border-pink-500/30 font-bold'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-900'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-pink-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

      </nav>

      {/* User Footer Profile & Quick Role Switcher */}
      <div className="pt-4 border-t border-gray-800/80 space-y-3">
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar
              src={user?.avatar}
              alt={user?.name || 'User'}
              size="sm"
              status="online"
              blurred={mode === 'stranger'}
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-200 truncate">
                {mode === 'stranger' ? (user?.pseudonym || 'Mystery Member') : user?.name}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {user?.role === 'admin' ? '🛡️ Administrator' : user?.email || 'Active Member'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
