import React from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, Compass, MapPin, MessageCircle, User, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const BottomNav = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/app', label: 'Feed', icon: Flame, end: true },
    { to: '/app/discover', label: 'Discover', icon: Compass },
    { to: '/app/map', label: 'Map', icon: MapPin },
    { to: '/app/chats', label: 'Chats', icon: MessageCircle, badge: 3 },
    { to: '/app/profile/me', label: 'Profile', icon: User },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : [])
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800/80 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 select-none min-h-touch min-w-touch
                ${
                  isActive
                    ? 'text-pink-500 font-bold scale-105'
                    : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-gray-950">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-pink-500" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
