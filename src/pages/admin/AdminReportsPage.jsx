import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { getReportsApi, resolveReportApi, dismissReportApi, banUserApi } from '../../api/admin';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await getReportsApi();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveReportApi(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissReportApi(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBan = async (userId) => {
    try {
      await banUserApi(userId, true);
      alert('User has been banned.');
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = reports.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Trust & Safety Reports</h1>
          <p className="text-xs text-gray-400">Investigate community reports, flagged interactions, and safety violations</p>
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'resolved', 'dismissed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors min-h-[36px] ${
                filter === tab
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-900 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(report => (
            <Card key={report.id} glass className="p-6 space-y-4 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{report.reason}</h3>
                    <p className="text-[11px] text-gray-400">
                      Report ID: {report.id} • Filed on {new Date(report.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.status === 'pending' && <Badge variant="warning">Pending Review</Badge>}
                  {report.status === 'resolved' && <Badge variant="success">Resolved</Badge>}
                  {report.status === 'dismissed' && <Badge variant="default">Dismissed</Badge>}
                </div>
              </div>

              {/* People involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Reporter</span>
                  <p className="text-sm font-bold text-gray-200 mt-0.5">{report.reporterName}</p>
                  <p className="text-[10px] text-gray-400">User ID: {report.reporterId}</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 uppercase font-bold">Reported Member</span>
                  <p className="text-sm font-bold text-white mt-0.5">{report.reportedUserName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      to={`/admin/users/${report.reportedUserId}`}
                      className="text-[11px] text-pink-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Member Dossier
                    </Link>
                  </div>
                </div>
              </div>

              {/* Details & Excerpt */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-gray-400">Reporter Comments:</span>
                <p className="text-gray-200 bg-gray-950 p-3 rounded-xl border border-gray-800">
                  {report.details}
                </p>
              </div>

              {report.chatExcerpt && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-gray-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                    <span>Captured Chat Excerpt:</span>
                  </span>
                  <div className="p-3 rounded-xl bg-black font-mono text-gray-300 border border-gray-800">
                    {report.chatExcerpt}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {report.status === 'pending' && (
                <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(report.id)}
                    icon={XCircle}
                  >
                    Dismiss Report
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleBan(report.reportedUserId)}
                    icon={Shield}
                  >
                    Ban Reported Account
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResolve(report.id)}
                    icon={CheckCircle2}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card glass className="p-12 text-center text-xs text-gray-400">
          No reports found under the "{filter}" category.
        </Card>
      )}
    </div>
  );
};

export default AdminReportsPage;
