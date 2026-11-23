import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertTriangle,
  LayoutDashboard,
  ArrowLeft,
  Sparkles,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, toggleRole, logout } = useAuthStore();

  const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/verify', label: 'ID Verification Queue', icon: CheckCircle, badge: '28' },
    { to: '/admin/reports', label: 'Safety Reports', icon: AlertTriangle, badge: '14' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100">
      {/* Admin Sidebar for Desktop */}
      <aside className="w-full md:w-64 lg:w-72 bg-gray-900 border-r border-gray-800 p-4 sm:p-5 flex flex-col shrink-0">
        {/* Brand */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Trust & Moderation</h2>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </div>

          <Link
            to="/app"
            title="Return to Member App"
            className="md:hidden text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> App
          </Link>
        </div>

        {/* Navigation */}
        <nav className="my-5 space-y-1.5 flex-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none min-h-touch
                  ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 border-t border-gray-800">
            <Link
              to="/app"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-pink-400 hover:bg-gray-800 transition-colors min-h-touch"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to SparkConnect App</span>
            </Link>
          </div>
        </nav>

        {/* Admin user footer info & demo toggle */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-950/60 border border-gray-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar
                src={user?.avatar}
                alt={user?.name || 'Admin'}
                size="sm"
                status="online"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-purple-400 font-mono">ROLE: ADMIN</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={toggleRole}
            className="w-full py-1.5 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-[10px] text-purple-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch Role to User</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
