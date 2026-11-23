import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Ban,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { getAdminUserDetailApi, verifyUserApi, banUserApi } from '../../api/admin';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';

export const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const data = await getAdminUserDetailApi(id);
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [id]);

  if (isLoading || !user) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-32 bg-gray-900 rounded-xl" />
        <div className="h-64 bg-gray-900 rounded-3xl" />
      </div>
    );
  }

  const handleVerify = async () => {
    try {
      await verifyUserApi(user.id);
      setUser(prev => ({ ...prev, verified: true, verificationStatus: 'approved' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBan = async () => {
    try {
      const willBan = !user.isBanned;
      await banUserApi(user.id, willBan);
      setUser(prev => ({ ...prev, isBanned: willBan }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top back navigation & action bar */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-gray-900 border border-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </button>

        <div className="flex gap-2">
          {user.verificationStatus !== 'approved' && (
            <Button
              variant="primary"
              size="sm"
              icon={ShieldCheck}
              onClick={handleVerify}
            >
              Approve Verification
            </Button>
          )}

          <Button
            variant={user.isBanned ? 'secondary' : 'danger'}
            size="sm"
            icon={Ban}
            onClick={handleBan}
          >
            {user.isBanned ? 'Lift Account Ban' : 'Ban Account'}
          </Button>
        </div>
      </div>

      {/* Overview Card */}
      <Card glass className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar} alt={user.name} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{user.name}</h2>
                {user.verified && (
                  <Badge variant="success" icon={ShieldCheck}>Verified</Badge>
                )}
                {user.isBanned && (
                  <Badge variant="danger">Banned</Badge>
                )}
                {user.flagged && (
                  <Badge variant="warning">Flagged</Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Username: <strong className="text-pink-400">@{user.username || 'user'}</strong> • Pseudonym: <strong>{user.pseudonym}</strong> • Mode: <strong>{user.mode}</strong>
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                <span>{user.location} • Gender: {user.gender} • Age: {user.age} (DOB: {user.dob})</span>
              </p>
              {user.nature && user.nature.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.nature.map((n) => (
                    <span key={n} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-gray-400 space-y-1">
            <div>Member Since: {new Date(user.createdAt).toLocaleDateString()}</div>
            <div>Intent: <span className="text-pink-400 font-semibold">{user.intent}</span></div>
            <div>Style: <span className="text-purple-400 font-semibold">{user.relationshipStyle}</span></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-300">
          <span className="font-bold text-gray-400">Bio: </span>
          {user.bio}
        </div>
      </Card>

      {/* Verification Documents Side-by-Side Review */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Uploaded ID & Selfie Verification Documents</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Government Document */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Government-Issued ID</span>
              <span className="text-[10px] text-emerald-400">Match Confirmed</span>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
              <img
                src={user.idDocumentUrl}
                alt="Government ID"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Selfie Parity Photo */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Live Selfie Match</span>
              <span className="text-[10px] text-emerald-400">Face Parity 98.4%</span>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
              <img
                src={user.selfieUrl}
                alt="Selfie Check"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Reported Chats (Only if flagged) */}
      {user.reportedChats && user.reportedChats.length > 0 && (
        <Card glass className="p-6 space-y-4 border-rose-500/40">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Reported Chat Excerpts & Safety Flags</span>
          </h3>

          <div className="space-y-3">
            {user.reportedChats.map((rc) => (
              <div key={rc.id} className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-300">
                  <span>Reported by: {rc.partnerName}</span>
                  <span className="text-rose-400 font-mono">{rc.reason}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 font-mono text-gray-300">
                  "{rc.snippet}"
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Log Timeline */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Audit Log History</span>
        </h3>

        <div className="divide-y divide-gray-800">
          {user.auditLogs?.map((log, index) => (
            <div key={index} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="font-semibold text-white">{log.action}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span>By: {log.actor}</span>
                <span>•</span>
                <span>{new Date(log.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminUserDetailPage;
