import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Navbar from '../components/Navbar';

const routeTitleMap = {
  '/app': 'Match Feed',
  '/app/discover': 'Discover Profiles',
  '/app/map': 'Spark Map (Live)',
  '/app/chats': 'Chats',
  '/app/profile/me': 'My Profile',
  '/app/profile/edit': 'Edit Profile',
  '/app/settings': 'Settings & Safety',
};

export const AppLayout = () => {
  const location = useLocation();

  // Find matching title for header
  const currentTitle = routeTitleMap[location.pathname] || (
    location.pathname.startsWith('/app/chats/')
      ? 'Conversation'
      : location.pathname.startsWith('/app/profile/')
      ? 'Member Profile'
      : 'SparkConnect'
  );

  // Check if we are inside a full-screen mobile chat thread
  const isIndividualChat = location.pathname.startsWith('/app/chats/') && location.pathname !== '/app/chats';
  const isMapPage = location.pathname === '/app/map';

  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100 antialiased">
      {/* Desktop Sidebar (md and up) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <Navbar title={currentTitle} />

        {/* Scrollable Viewport */}
        <main
          className={`flex-1 overflow-y-auto ${
            isIndividualChat ? 'pb-0' : isMapPage ? 'pb-16 md:pb-2' : 'pb-20 md:pb-8'
          }`}
        >
          <div
            className={`max-w-7xl mx-auto ${
              isMapPage ? 'px-2 sm:px-4 py-2' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-6'
            }`}
          >
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation (Hidden on individual chat full screen to allow keyboard input) */}
        {!isIndividualChat && <BottomNav />}
      </div>
    </div>
  );
};

export default AppLayout;
