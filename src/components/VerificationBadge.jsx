import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const VerificationBadge = ({ size = 'sm', tooltip = 'ID Verified Member' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span
      title={tooltip}
      className="inline-flex items-center justify-center text-sky-400 bg-sky-950/60 border border-sky-400/40 rounded-full p-0.5 shadow-sm shadow-sky-500/20 shrink-0"
    >
      <ShieldCheck className={`${sizeMap[size]} stroke-[2.5]`} />
    </span>
  );
};

export default VerificationBadge;
