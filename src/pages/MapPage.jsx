import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Compass,
  Locate,
  Crosshair,
  Flame,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Search,
  Filter,
  Plus,
  Minus,
  Maximize2,
  X,
  MessageCircle,
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertCircle,
  Radio,
  Zap,
  Users,
} from 'lucide-react';
import { getNearbyMapSparksApi, getMapHotspotsApi } from '../api/map';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Badge from '../components/Badge';

export const MapPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const {
    ghostMode,
    toggleGhostMode,
    userLocation,
    setUserLocation,
    isUserRevealed,
  } = useProfileStore();

  const [sparks, setSparks] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null); // Selected user or hotspot
  const [selectedType, setSelectedType] = useState(null); // 'user' | 'hotspot'

  // Map Filter State
  const [activeIntent, setActiveIntent] = useState('all');
  const [activeNature, setActiveNature] = useState('all');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  // Map Viewport Controls (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const mapContainerRef = useRef(null);

  // Load Sparks & Hotspots
  useEffect(() => {
    const loadMapData = async () => {
      setIsLoading(true);
      try {
        const [sparksData, hotspotsData] = await Promise.all([
          getNearbyMapSparksApi({
            intent: activeIntent,
            nature: activeNature,
            onlineOnly,
          }),
          getMapHotspotsApi(),
        ]);
        setSparks(sparksData);
        setHotspots(hotspotsData);
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMapData();
  }, [activeIntent, activeNature, onlineOnly]);

  // Request Live HTML5 Geolocation
  const handleRequestLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          name: 'Your Current Spot (Live GPS)',
          isGps: true,
          radius: '0.8 mi approximate',
        });
        setIsGpsActive(true);
        // Center pan
        setPan({ x: 0, y: 0 });
        setZoom(1.15);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setGpsError('Location access declined. Showing default city vibe center.');
        setTimeout(() => setGpsError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleRecenter = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedPin(null);
  };

  // Pan handlers (drag)
  const handlePointerDown = (e) => {
    // Only drag on left click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // User Pin selection
  const handleSelectUser = (user, e) => {
    e?.stopPropagation();
    setSelectedType('user');
    setSelectedPin(user);
  };

  // Hotspot selection
  const handleSelectHotspot = (hotspot, e) => {
    e?.stopPropagation();
    setSelectedType('hotspot');
    setSelectedPin(hotspot);
  };

  // Dismiss card
  const handleCloseCard = () => {
    setSelectedPin(null);
    setSelectedType(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-125px)] md:h-[calc(100vh-100px)] rounded-3xl overflow-hidden border border-gray-800 bg-gray-950 shadow-2xl flex flex-col select-none">
      {/* 1. TOP SNAP MAP BAR (Glassmorphism Header) */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Status & City Pill */}
          <div className="pointer-events-auto flex items-center gap-2 bg-gray-950/85 backdrop-blur-xl border border-gray-800/90 py-1.5 px-3 rounded-2xl shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Spark Map</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-pink-500/20 text-pink-400 font-mono rounded">
                  Live
                </span>
              </span>
              <span className="text-[10px] text-gray-400">
                {userLocation?.name || 'Downtown Metropolis'} • {sparks.length} Sparks Nearby
              </span>
            </div>
          </div>

          {/* Quick Actions (Ghost Mode & GPS) */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Ghost Mode Toggle */}
            <button
              onClick={toggleGhostMode}
              title={
                ghostMode
                  ? 'Ghost Mode is ON. You are invisible on the map.'
                  : 'Ghost Mode is OFF. Nearby members can see your approximate location.'
              }
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all shadow-lg min-h-touch cursor-pointer
                ${
                  ghostMode
                    ? 'bg-purple-950 text-purple-200 border border-purple-500/60 shadow-purple-900/40 ring-1 ring-purple-500/50'
                    : 'bg-gray-900/90 hover:bg-gray-800 text-gray-300 border border-gray-700'
                }
              `}
            >
              {ghostMode ? (
                <>
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  <span>Ghost Mode ON</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-pink-400" />
                  <span>Visible on Map</span>
                </>
              )}
            </button>

            {/* Live GPS Button */}
            <button
              onClick={handleRequestLiveLocation}
              title="Locate me via GPS"
              className={`
                p-2.5 rounded-2xl border transition-all shadow-lg min-h-touch min-w-touch flex items-center justify-center cursor-pointer
                ${
                  isGpsActive
                    ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                    : 'bg-gray-900/90 hover:bg-gray-800 border-gray-700 text-gray-300'
                }
              `}
            >
              <Crosshair className={`w-4 h-4 ${isGpsActive ? 'animate-spin text-pink-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ghost Mode Active Warning Notice */}
        {ghostMode && (
          <div className="pointer-events-auto self-start bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-[11px] text-purple-300 px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 animate-slide-down">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>You are in Ghost Mode. Your spot is hidden from other members.</span>
          </div>
        )}

        {/* GPS Alert if failed */}
        {gpsError && (
          <div className="pointer-events-auto self-start bg-rose-950/90 border border-rose-500/40 text-[11px] text-rose-300 px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Filter Chips Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
          {/* Intent Filters */}
          {[
            { id: 'all', label: 'All Sparks' },
            { id: 'romance', label: '💖 Romance' },
            { id: 'casual', label: '🔥 Casual' },
            { id: 'friends', label: '🌟 Friends' },
            { id: 'exploring', label: '🌌 Exploring' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveIntent(chip.id)}
              className={`
                px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shadow-sm shrink-0 min-h-touch cursor-pointer
                ${
                  activeIntent === chip.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30'
                    : 'bg-gray-950/80 text-gray-400 hover:text-white border border-gray-800'
                }
              `}
            >
              {chip.label}
            </button>
          ))}

          {/* Online Filter */}
          <button
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`
              px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shadow-sm shrink-0 min-h-touch flex items-center gap-1 cursor-pointer
              ${
                onlineOnly
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : 'bg-gray-950/80 text-gray-400 hover:text-white border border-gray-800'
              }
            `}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Active Now</span>
          </button>

          {/* Hotspots Toggle */}
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`
              px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shadow-sm shrink-0 min-h-touch flex items-center gap-1 cursor-pointer
              ${
                showHotspots
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                  : 'bg-gray-950/80 text-gray-400 hover:text-white border border-gray-800'
              }
            `}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Hotspots</span>
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE MAP VIEWPORT (SVG/Canvas Cartography) */}
      <div
        ref={mapContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCloseCard}
        className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden bg-gray-950"
      >
        {/* Transform Layer for Pan & Zoom */}
        <div
          className="absolute inset-0 transition-transform duration-75 will-change-transform origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Cyberpunk Midnight Dark Cartography Canvas */}
          <svg
            className="w-[180%] h-[180%] -top-[40%] -left-[40%] absolute pointer-events-none opacity-90"
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Radial City Gradient Glow */}
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.12" />
                <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#030712" stopOpacity="0" />
              </radialGradient>

              {/* River Gradients */}
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#082f49" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#0c4a6e" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#082f49" stopOpacity="0.6" />
              </linearGradient>

              {/* Hotspot Pulse */}
              <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* City Grid Background */}
            <rect width="1000" height="1000" fill="#030712" />
            <rect width="1000" height="1000" fill="url(#centerGlow)" />

            {/* Stylized River Waterways */}
            <path
              d="M 120 0 C 180 200, 260 400, 240 600 C 220 750, 320 900, 360 1000 L 460 1000 C 420 900, 320 750, 340 600 C 360 400, 280 200, 220 0 Z"
              fill="url(#riverGrad)"
            />
            <path
              d="M 680 0 C 650 250, 610 500, 680 750 C 730 900, 780 950, 840 1000 L 920 1000 C 860 950, 810 900, 760 750 C 690 500, 730 250, 760 0 Z"
              fill="url(#riverGrad)"
            />

            {/* Cyber Grid Lines (Avenues and Streets) */}
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((coord) => (
              <g key={`grid-${coord}`} opacity="0.18">
                <line x1="0" y1={coord} x2="1000" y2={coord} stroke="#374151" strokeWidth="1" strokeDasharray="3 6" />
                <line x1={coord} y1="0" x2={coord} y2="1000" stroke="#374151" strokeWidth="1" strokeDasharray="3 6" />
              </g>
            ))}

            {/* Major Neon Expressways & Bridges */}
            <path
              d="M 0 450 Q 500 500 1000 460"
              stroke="#ec4899"
              strokeWidth="2.5"
              strokeOpacity="0.25"
            />
            <path
              d="M 0 450 Q 500 500 1000 460"
              stroke="#ec4899"
              strokeWidth="1"
              strokeOpacity="0.5"
            />

            <path
              d="M 0 620 Q 500 580 1000 640"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeOpacity="0.25"
            />
            <path
              d="M 0 620 Q 500 580 1000 640"
              stroke="#8b5cf6"
              strokeWidth="1"
              strokeOpacity="0.5"
            />

            <path
              d="M 500 0 L 500 1000"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeOpacity="0.2"
            />

            {/* Neighborhood Footprints & Labels */}
            <g fill="#4b5563" fontSize="11" fontFamily="sans-serif" fontWeight="bold" letterSpacing="2">
              <text x="460" y="470" fill="#9ca3af" opacity="0.45">SOHO</text>
              <text x="630" y="420" fill="#9ca3af" opacity="0.45">EAST VILLAGE</text>
              <text x="750" y="380" fill="#9ca3af" opacity="0.45">WILLIAMSBURG</text>
              <text x="400" y="650" fill="#9ca3af" opacity="0.45">DOWNTOWN</text>
              <text x="540" y="680" fill="#9ca3af" opacity="0.45">DUMBO</text>
              <text x="360" y="220" fill="#9ca3af" opacity="0.45">UPPER WEST</text>
              <text x="180" y="520" fill="#9ca3af" opacity="0.45">JERSEY CITY</text>
            </g>
          </svg>

          {/* RADAR SWEEP ANIMATION AROUND CURRENT USER */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: '50%', top: '50%' }}
          >
            {/* Pulsing Concentric Range Rings */}
            <div className="w-56 h-56 rounded-full border border-pink-500/20 absolute -inset-28 animate-ping opacity-25" />
            <div className="w-96 h-96 rounded-full border border-purple-500/15 absolute -inset-48" />
            <div className="w-[500px] h-[500px] rounded-full border border-cyan-500/10 absolute -inset-[250px]" />
            {/* Spinning Radar Conic Beam */}
            <div className="w-80 h-80 rounded-full absolute -inset-40 bg-gradient-to-tr from-pink-500/10 via-transparent to-transparent animate-spin duration-[6000ms]" />
          </div>

          {/* 3. HOTSPOTS CLUSTER MARKERS */}
          {showHotspots &&
            hotspots.map((spot) => {
              const isSelected = selectedPin?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  onClick={(e) => handleSelectHotspot(spot, e)}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className={`
                    absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group transition-all duration-300
                    ${isSelected ? 'scale-125 z-30' : 'hover:scale-115'}
                  `}
                >
                  {/* Glowing Hotspot Heat Aura */}
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 absolute -inset-4 animate-pulse pointer-events-none" />

                  {/* Hotspot Floating Pill */}
                  <div className="relative flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 px-3 py-1.5 rounded-full shadow-xl shadow-amber-500/30 text-white font-black text-xs border border-amber-300/40">
                    <Flame className="w-4 h-4 fill-white animate-bounce" />
                    <span>{spot.sparksCount} Sparks</span>
                  </div>

                  {/* Spot Title Callout */}
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-gray-950/90 text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30 whitespace-nowrap shadow-md pointer-events-none">
                    {spot.name}
                  </div>
                </div>
              );
            })}

          {/* 4. CURRENT USER'S LOCATION MARKER (SNAP MAP BITMOJI STYLE) */}
          <div
            style={{ left: '50%', top: '50%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="relative flex flex-col items-center">
              {/* Radar Wave Ring */}
              <div
                className={`w-14 h-14 rounded-full absolute -top-1 animate-ping opacity-60 ${
                  ghostMode ? 'bg-purple-500' : 'bg-pink-500'
                }`}
              />

              {/* User Avatar Circle */}
              <div
                className={`
                  w-12 h-12 rounded-full p-0.5 shadow-2xl transition-all relative
                  ${
                    ghostMode
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 opacity-70 ring-4 ring-purple-500/30'
                      : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 ring-4 ring-pink-500/40'
                  }
                `}
              >
                <img
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80'
                  }
                  alt="You"
                  className="w-full h-full rounded-full object-cover"
                />

                {/* Badge (You or Ghost) */}
                <div
                  className={`
                    absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase text-white shadow
                    ${ghostMode ? 'bg-purple-700' : 'bg-pink-600'}
                  `}
                >
                  {ghostMode ? '👻' : 'YOU'}
                </div>
              </div>

              {/* You Pill */}
              <div
                className={`
                  mt-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight whitespace-nowrap shadow-lg border
                  ${
                    ghostMode
                      ? 'bg-purple-950/90 text-purple-300 border-purple-500/40'
                      : 'bg-gray-950/90 text-white border-pink-500/40'
                  }
                `}
              >
                {ghostMode ? 'Ghost Mode (Hidden)' : 'You (Live Spot)'}
              </div>
            </div>
          </div>

          {/* 5. NEARBY MEMBER PINS (SPARKS) */}
          {sparks.map((member) => {
            const isStranger =
              member.mode === 'stranger' &&
              !member.revealed &&
              !isUserRevealed(member.id);
            const isSelected = selectedPin?.id === member.id;
            const displayName = isStranger ? member.pseudonym : member.name;

            return (
              <div
                key={member.id}
                onClick={(e) => handleSelectUser(member, e)}
                style={{ left: `${member.x}%`, top: `${member.y}%` }}
                className={`
                  absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group transition-all duration-200
                  ${isSelected ? 'scale-125 z-30' : 'hover:scale-115'}
                `}
              >
                <div className="relative flex flex-col items-center">
                  {/* Active Online Pulse */}
                  {member.activeNow && (
                    <span className="w-10 h-10 rounded-full bg-emerald-400/40 absolute -top-0.5 animate-ping opacity-50" />
                  )}

                  {/* Bitmoji Pin Avatar Frame */}
                  <div
                    className={`
                      w-11 h-11 rounded-2xl p-0.5 shadow-2xl transition-all relative flex items-center justify-center
                      ${
                        isStranger
                          ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-900 ring-2 ring-purple-400/50'
                          : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 ring-2 ring-pink-400/50'
                      }
                    `}
                  >
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-gray-900 relative">
                      <img
                        src={member.avatar}
                        alt={displayName}
                        className={`w-full h-full object-cover ${
                          isStranger ? 'blur-sm scale-110' : ''
                        }`}
                      />
                      {isStranger && (
                        <div className="absolute inset-0 bg-purple-950/50 flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5 text-purple-300" />
                        </div>
                      )}
                    </div>

                    {/* Online Dot */}
                    {member.activeNow && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-gray-950" />
                    )}

                    {/* Intent Micro-Badge */}
                    <div className="absolute -bottom-1 -left-1 text-[10px] bg-gray-950/90 rounded-full px-1 shadow border border-gray-800">
                      {member.intent === 'Romance'
                        ? '💖'
                        : member.intent === 'Casual'
                        ? '🔥'
                        : member.intent === 'Friends'
                        ? '🌟'
                        : '🌌'}
                    </div>
                  </div>

                  {/* Hover or Selected Callout Tag */}
                  <div
                    className={`
                      mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-lg border transition-opacity
                      ${
                        isSelected
                          ? 'bg-pink-600 text-white border-pink-400 opacity-100'
                          : 'bg-gray-950/90 text-gray-200 border-gray-800 opacity-0 group-hover:opacity-100'
                      }
                    `}
                  >
                    <span>{displayName}</span>
                    <span className="text-gray-400 ml-1">({member.distance}mi)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MAP ZOOM & VIEWPORT CONTROLS (Floating Right) */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-11 h-11 rounded-2xl bg-gray-950/85 backdrop-blur-xl border border-gray-800 text-white hover:bg-gray-800 transition-all flex items-center justify-center shadow-xl active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-11 h-11 rounded-2xl bg-gray-950/85 backdrop-blur-xl border border-gray-800 text-white hover:bg-gray-800 transition-all flex items-center justify-center shadow-xl active:scale-95"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          onClick={handleRecenter}
          title="Center on me"
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white transition-all flex items-center justify-center shadow-xl shadow-pink-500/25 active:scale-95 hover:opacity-90"
        >
          <Locate className="w-5 h-5" />
        </button>
      </div>

      {/* 4. SNAP MAP BOTTOM SHEET / FLOATING MATCH CARD */}
      {selectedPin && (
        <div className="absolute bottom-4 inset-x-3 sm:inset-x-auto sm:left-6 sm:w-96 z-30 animate-slide-up">
          <div className="p-4 sm:p-5 rounded-3xl bg-gray-950/95 backdrop-blur-2xl border border-gray-700/80 shadow-2xl space-y-3.5">
            {/* Header: Close Button */}
            <div className="flex items-center justify-between pb-1 border-b border-gray-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                {selectedType === 'hotspot' ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Popular Nightlife Hotspot</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nearby Spark Connection</span>
                  </>
                )}
              </span>
              <button
                onClick={handleCloseCard}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content for USER */}
            {selectedType === 'user' && (
              <>
                <div className="flex items-center gap-3.5">
                  <Avatar
                    src={selectedPin.avatar}
                    alt={selectedPin.name}
                    size="lg"
                    status={selectedPin.activeNow ? 'online' : 'offline'}
                    blurred={
                      selectedPin.mode === 'stranger' &&
                      !selectedPin.revealed &&
                      !isUserRevealed(selectedPin.id)
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-white truncate">
                        {selectedPin.mode === 'stranger' &&
                        !selectedPin.revealed &&
                        !isUserRevealed(selectedPin.id)
                          ? selectedPin.pseudonym
                          : selectedPin.name}
                      </h3>
                      <span className="text-sm text-gray-400">{selectedPin.age}</span>
                      {selectedPin.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      )}
                    </div>

                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-500" />
                      <span>
                        {selectedPin.neighborhood || selectedPin.location} •{' '}
                        <span className="text-pink-400 font-semibold">{selectedPin.distance} mi away</span>
                      </span>
                    </p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                        {selectedPin.intent}
                      </span>
                      {selectedPin.mode === 'stranger' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">
                          Incognito
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nature Traits */}
                {selectedPin.nature && selectedPin.nature.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPin.nature.slice(0, 4).map((trait, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {selectedPin.bio}
                </p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={MessageCircle}
                    onClick={() => navigate(`/app/chats`)}
                  >
                    Say Hi
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => navigate(`/app/profile/${selectedPin.id}`)}
                  >
                    Full Profile
                  </Button>
                </div>
              </>
            )}

            {/* Content for HOTSPOT */}
            {selectedType === 'hotspot' && (
              <>
                <div className="rounded-2xl overflow-hidden h-28 relative">
                  <img
                    src={selectedPin.image}
                    alt={selectedPin.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/90 text-gray-950 font-black text-[11px]">
                    <Flame className="w-3.5 h-3.5 fill-gray-950" />
                    <span>{selectedPin.sparksCount} Active Sparks</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">{selectedPin.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedPin.neighborhood}</p>
                  <p className="text-xs text-amber-300/90 italic mt-1 leading-relaxed">
                    "{selectedPin.activeVibe}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedPin.tags?.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-900 text-gray-300 border border-gray-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    handleCloseCard();
                    setActiveIntent('all');
                  }}
                >
                  Explore Who's Here
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
