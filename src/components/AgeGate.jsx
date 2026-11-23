import React from 'react';
import { calculateAge } from '../utils/helpers';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import Button from './Button';

export const AgeGate = ({ dob, children, onUnderageRedirect }) => {
  if (!dob) {
    return <>{children}</>;
  }

  const age = calculateAge(dob);

  if (age !== null && age < 18) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-rose-950/40 border border-rose-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Age Verification Notice</h2>
          <p className="text-sm text-gray-300 mb-6">
            SparkConnect is an exclusive adult discovery and dating platform. You must be at least 18 years old to access this application.
          </p>
          <div className="bg-gray-900/80 rounded-xl p-3 mb-6 text-xs text-rose-300 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Calculated Age: {age} years (Minimum required: 18)</span>
          </div>
          {onUnderageRedirect && (
            <Button variant="danger" fullWidth onClick={onUnderageRedirect}>
              Return to Safety
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AgeGate;
