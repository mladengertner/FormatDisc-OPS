
import React from 'react';
import { ChaosConfig } from '../types';

interface Props {
  config: ChaosConfig;
  onChange: (config: ChaosConfig) => void;
}

const ChaosControl: React.FC<Props> = ({ config, onChange }) => {
  return (
    <div className="bg-fd-panel border border-fd-danger/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-fd-danger animate-ping" />
        <h3 className="text-xs font-bold text-fd-danger uppercase tracking-[0.22em]">Chaos Lab v12.5</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] text-fd-muted uppercase mb-1">
            <span>Network Latency</span>
            <span className="text-fd-text">{(config.latencyFactor * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="1" max="10" step="0.5"
            value={config.latencyFactor}
            onChange={(e) => onChange({...config, latencyFactor: parseFloat(e.target.value)})}
            className="w-full accent-fd-danger h-1 bg-fd-panel2 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-fd-muted uppercase mb-1">
            <span>API Failure Rate</span>
            <span className="text-fd-text">{(config.failureRate * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.1"
            value={config.failureRate}
            onChange={(e) => onChange({...config, failureRate: parseFloat(e.target.value)})}
            className="w-full accent-fd-danger h-1 bg-fd-panel2 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button 
          onClick={() => onChange({...config, integrityBreach: !config.integrityBreach})}
          className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
            config.integrityBreach 
              ? 'bg-fd-danger border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
              : 'bg-transparent border-fd-danger/50 text-fd-danger/70 hover:border-fd-danger hover:text-fd-danger'
          }`}
        >
          {config.integrityBreach ? 'DATA BREACH ACTIVE' : 'Inject Integrity Breach'}
        </button>
      </div>
    </div>
  );
};

export default ChaosControl;