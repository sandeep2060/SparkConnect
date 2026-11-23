import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getStatsApi } from '../../api/admin';
import Card from '../../components/Card';
import Button from '../../components/Button';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await getStatsApi();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-900 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Registered',
      value: stats.totalUsers.toLocaleString(),
      change: '+14% this week',
      icon: Users,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      link: '/admin/users',
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      change: 'Avg queue time 12m',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      link: '/admin/verify',
    },
    {
      title: 'Open Safety Reports',
      value: stats.reportsCount,
      change: '3 urgent reviews',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      link: '/admin/reports',
    },
    {
      title: 'Active Today',
      value: stats.activeToday.toLocaleString(),
      change: '82% verified active',
      icon: Activity,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      link: '/admin/users',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Platform Overview</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              Live Monitoring
            </span>
          </h1>
          <p className="text-xs text-gray-400">
            Real-time telemetry on member growth, identity safety, and report queues
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/admin/verify">
            <Button variant="primary" size="sm" icon={ShieldCheck}>
              Review Verifications ({stats.pendingVerifications})
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} to={c.link}>
              <Card glass hoverable className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">{c.title}</span>
                  <div className={`p-2 rounded-xl border ${c.bg} ${c.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {c.value}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 flex items-center">
                    {c.change}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Chart Section */}
      <Card glass className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <span>Match & Sign-up Velocity (Last 7 Days)</span>
            </h3>
            <p className="text-xs text-gray-400">Daily sparks connected and registrations</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-gray-300">New Matches</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-300">Sign-ups</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" tickLine={false} />
              <YAxis stroke="#6b7280" tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="matches" stroke="#ec4899" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMatches)" />
              <Area type="monotone" dataKey="users" stroke="#9333ea" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Moderation Short-cuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Identity Audit Queue</span>
            </h4>
            <Link to="/admin/verify" className="text-xs text-pink-400 hover:underline">
              Inspect all ({stats.pendingVerifications})
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            28 members submitted government passports and selfie matches waiting for administrator review.
          </p>
          <Link to="/admin/verify">
            <Button variant="secondary" size="sm" fullWidth>
              Open Verification Workspace
            </Button>
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Trust & Safety Inquiries</span>
            </h4>
            <Link to="/admin/reports" className="text-xs text-pink-400 hover:underline">
              View reports ({stats.reportsCount})
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            3 reports marked as high priority (unsolicited media and underage suspicion flags).
          </p>
          <Link to="/admin/reports">
            <Button variant="danger" size="sm" fullWidth>
              Moderate Urgent Reports
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
