import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Ban,
  Eye,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { getAdminUsersApi, verifyUserApi, banUserApi } from '../../api/admin';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsersApi({ search, status: statusFilter });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleVerify = async (userId) => {
    try {
      await verifyUserApi(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: true, verificationStatus: 'approved' } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBanToggle = async (user) => {
    try {
      const shouldBan = !user.isBanned;
      await banUserApi(user.id, shouldBan);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: shouldBan } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Users' },
    { id: 'approved', label: 'Verified' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'flagged', label: 'Flagged' },
    { id: 'banned', label: 'Banned' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Member Directory & Moderation</h1>
          <p className="text-xs text-gray-400">Search, verify identity records, or issue account restrictions</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, pseudonym, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
        </form>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card glass className="overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-950/80 border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Discovery Mode</th>
                <th className="py-3.5 px-4">ID Verification</th>
                <th className="py-3.5 px-4">Intent</th>
                <th className="py-3.5 px-4">Flag / Trust</th>
                <th className="py-3.5 px-4 text-right">Moderator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map(user => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-850/50 transition-colors ${
                      user.isBanned ? 'bg-rose-950/10 opacity-70' : ''
                    }`}
                  >
                    {/* Member Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          size="sm"
                          status={user.activeNow ? 'online' : 'offline'}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-100 text-sm">
                              {user.name}
                            </span>
                            {user.age && (
                              <span className="text-gray-400">({user.age})</span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 font-mono">
                            ID: {user.id} • @{user.username || 'user'} • {user.gender} • {user.location}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Mode */}
                    <td className="py-3 px-4">
                      {user.mode === 'stranger' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-[11px] font-bold text-purple-300">
                          <Lock className="w-3 h-3" />
                          <span>Stranger ({user.pseudonym})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-[11px] font-bold text-pink-400">
                          <span>Public Mode</span>
                        </span>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      {user.verificationStatus === 'approved' && (
                        <Badge variant="success" icon={ShieldCheck}>
                          Approved
                        </Badge>
                      )}
                      {user.verificationStatus === 'pending' && (
                        <Badge variant="warning">
                          Pending Audit
                        </Badge>
                      )}
                      {user.verificationStatus === 'rejected' && (
                        <Badge variant="danger">
                          Rejected
                        </Badge>
                      )}
                    </td>

                    {/* Intent */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-300">{user.intent || 'Exploring'}</span>
                    </td>

                    {/* Flag / Trust */}
                    <td className="py-3 px-4">
                      {user.isBanned ? (
                        <span className="text-[11px] font-bold text-rose-500 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-full">
                          Banned
                        </span>
                      ) : user.flagged ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flagged (Reported)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400">Normal</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.verificationStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleVerify(user.id)}
                            title="Quick Approve ID"
                            className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900 transition-colors"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleBanToggle(user)}
                          title={user.isBanned ? 'Unban user' : 'Ban user account'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isBanned
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              : 'bg-rose-950/60 border border-rose-500/30 text-rose-400 hover:bg-rose-900'
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/admin/users/${user.id}`}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors inline-block"
                          title="View Full Admin Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No members match search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
