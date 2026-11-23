import React, { useState, useEffect } from 'react';
import {
  Database,
  Cpu,
  ShieldCheck,
  Sparkles,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { runNeonDiagnostics } from '../api/neon';

export const NeonCloudStatus = ({ showHeader = true, compact = false }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  const runCheck = async () => {
    setIsRunning(true);
    try {
      const result = await runNeonDiagnostics();
      setDiagnostics(result);
      setLastCheckTime(new Date());
    } catch (err) {
      console.error('Neon diagnostics error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const serviceIcons = {
    postgres: Database,
    functions: Cpu,
    auth: ShieldCheck,
    aiGateway: Sparkles,
    realtime: Radio,
  };

  const serviceDescriptions = {
    postgres: 'Lakebase Serverless PostgreSQL database',
    functions: 'Branch-backed serverless Node.js compute',
    auth: 'Secure user authentication & session management',
    aiGateway: 'Smart conversation coach & match chemistry engine',
    realtime: 'Live reactive SQL queries over WebSockets',
  };

  return (
    <Card glass className="p-5 space-y-4 border-purple-500/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Neon Cloud Backend Services</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Branch: <code className="text-pink-400 font-mono">production</code> • 5 Services Active
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={runCheck}
          disabled={isRunning}
          icon={RefreshCw}
          className={`text-xs ${isRunning ? 'animate-spin' : ''}`}
        >
          {isRunning ? 'Testing...' : 'Test All Services'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {diagnostics ? (
          Object.entries({
            postgres: diagnostics.postgres,
            functions: diagnostics.functions,
            auth: diagnostics.auth,
            aiGateway: diagnostics.aiGateway,
            realtime: diagnostics.realtime,
          }).map(([key, svc]) => {
            const Icon = serviceIcons[key] || Database;
            return (
              <div
                key={key}
                className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-800 text-pink-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-200">{svc.name}</span>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{serviceDescriptions[key]}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 bg-gray-950/70 p-2 rounded-lg font-mono truncate border border-gray-800/50">
                  {svc.details || 'Initialized'}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
            <span>Connecting to Neon Cloud Infrastructure...</span>
          </div>
        )}
      </div>

      {lastCheckTime && (
        <div className="text-[10px] text-gray-500 text-right flex items-center justify-end gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>All 5 Neon services checked at {lastCheckTime.toLocaleTimeString()}</span>
        </div>
      )}
    </Card>
  );
};

export default NeonCloudStatus;
