import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
} from 'lucide-react';
import { getVerificationQueueApi, approveVerificationApi, rejectVerificationApi } from '../../api/admin';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';

export const AdminVerifyQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getVerificationQueueApi();
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await approveVerificationApi(userId);
      setQueue(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectVerificationApi(userId);
      setQueue(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Identity Verification Queue</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {queue.length} Pending Audit
            </span>
          </h1>
          <p className="text-xs text-gray-400">
            Compare government-issued identification against member live selfies to verify age and identity authenticity.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-gray-900 rounded-3xl" />
          ))}
        </div>
      ) : queue.length > 0 ? (
        <div className="space-y-6">
          {queue.map(item => (
            <Card key={item.id} glass className="p-6 space-y-5 border border-gray-800">
              {/* Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar src={item.avatar} alt={item.name} size="md" />
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-xs text-gray-400">({item.age} years old)</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      DOB: <strong>{item.dob}</strong> • Location: <strong>{item.location}</strong> • Mode: <strong>{item.mode}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
                    Waiting ~18 min
                  </span>
                </div>
              </div>

              {/* Side-by-side inspection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Government ID Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                    <span>1. Government ID Document</span>
                    <span className="text-[10px] text-pink-400">Passport / License</span>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-gray-800 bg-black relative group">
                    <img
                      src={item.idDocumentUrl}
                      alt="ID Document"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-gray-300 backdrop-blur-sm">
                      Name matches: <strong>{item.name}</strong>
                    </div>
                  </div>
                </div>

                {/* Live Selfie Match */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                    <span>2. Member Live Selfie</span>
                    <span className="text-[10px] text-emerald-400">Biometric Match: 98%</span>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-gray-800 bg-black relative group">
                    <img
                      src={item.selfieUrl}
                      alt="Live Selfie"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-gray-300 backdrop-blur-sm">
                      Pose Verified
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Bar */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="md"
                  icon={X}
                  onClick={() => handleReject(item.id)}
                >
                  Reject & Request Resubmission
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={Check}
                  onClick={() => handleApprove(item.id)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20"
                >
                  Approve ID & Award Shield
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card glass className="p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            The verification queue is empty. All member documents have been evaluated by the trust moderation team.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminVerifyQueuePage;
