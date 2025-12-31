
import React from 'react';

interface SystemIdentityProps {
  kernelVersion: string;
  instanceId: string;
  status: 'ACTIVE' | 'WAR' | 'IDLE';
}

const SystemIdentity: React.FC<SystemIdentityProps> = ({ kernelVersion, instanceId, status }) => {
  return (
    <div className="flex items-center gap-4 bg-black border border-[#111] px-4 py-1.5 rounded-sm select-none">
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-[#444] uppercase tracking-[0.2em] leading-none mb-1">System_ID</span>
        <span className="text-[10px] font-mono text-[#00ff41] leading-none">{instanceId}</span>
      </div>
      <div className="w-px h-6 bg-[#111]" />
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-[#444] uppercase tracking-[0.2em] leading-none mb-1">Kernel_Tag</span>
        <span className="text-[10px] font-mono text-white leading-none">{kernelVersion}</span>
      </div>
      <div className="w-px h-6 bg-[#111]" />
      <div className="flex items-center gap-2 pl-1">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'WAR' ? 'bg-red-500 animate-pulse' : 'bg-[#00ff41]'} shadow-[0_0_8px_currentColor]`} />
        <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{status}</span>
      </div>
    </div>
  );
};

export default SystemIdentity;
