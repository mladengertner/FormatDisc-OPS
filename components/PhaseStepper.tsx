import React from 'react';
import { useWarStack } from '../context/WarStackContext';
import { MotionWrapper } from './MotionWrapper';

interface Phase {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
}

export const PhaseStepper: React.FC = () => {
  const { state: warStackState } = useWarStack();
  
  const phases: Phase[] = [
    {
      id: 1,
      name: 'Scope Lock',
      description: 'Define MVP boundaries and constraints',
      status: 'success',
      progress: 100,
    },
    {
      id: 2,
      name: 'Blueprint Generation',
      description: 'Create detailed architecture blueprint',
      status: 'running',
      progress: 65,
    },
    {
      id: 3,
      name: 'Sandbox Simulation',
      description: 'Run deterministic simulations',
      status: 'pending',
      progress: 0,
    },
    {
      id: 4,
      name: 'Compliance Audit',
      description: 'Verify against standards',
      status: 'pending',
      progress: 0,
    },
    {
      id: 5,
      name: 'Deployment Readiness',
      description: 'Final verification and packaging',
      status: 'pending',
      progress: 0,
    },
  ];

  const getStatusColor = (status: Phase['status']) => {
    switch (status) {
      case 'success': return 'bg-fd-neon-green';
      case 'running': return 'bg-fd-neon-blue animate-pulse-soft';
      case 'failed': return 'bg-fd-danger animate-shake-subtle';
      case 'pending': return 'bg-fd-muted';
      default: return 'bg-fd-muted';
    }
  };

  const getStatusGlow = (status: Phase['status']) => {
    switch (status) {
      case 'success': return 'shadow-fd-shadow-neon-green';
      case 'running': return 'shadow-fd-shadow-neon-blue';
      case 'failed': return 'shadow-[0_0_18px_rgba(239,68,68,0.3)]';
      default: return '';
    }
  };

  return (
    <MotionWrapper state="entering" className="bg-fd-panel border border-fd-border rounded-fd-radius-card p-4 lg:p-6 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm lg:text-base font-semibold">Pipeline Execution</h2>
        <span className={`text-xs px-2 py-1 rounded-fd-radius-pill ${getStatusColor(warStackState.mode === 'WAR' ? 'running' : 'success')}`}>
          {warStackState.mode}
        </span>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className="flex items-center space-x-4 p-3 rounded-fd-radius-card bg-fd-panel2/50 border border-fd-border hover:border-fd-neon-blue/30 transition-all animate-fade-in-up"
          >
            {/* Status Indicator */}
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(phase.status)} ${getStatusGlow(phase.status)}`}
              />
              {phase.status === 'running' && (
                <div className="absolute inset-0 rounded-full bg-fd-neon-blue animate-ping opacity-20" />
              )}
            </div>

            {/* Phase Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium">{phase.name}</h3>
                <span className="text-xs text-fd-muted">
                  {phase.status === 'running' && `${phase.progress}%`}
                  {phase.status === 'success' && '✓'}
                  {phase.status === 'failed' && '✗'}
                  {phase.status === 'pending' && '–'}
                </span>
              </div>
              <p className="text-xs text-fd-muted mb-2">{phase.description}</p>
              
              {/* Progress Bar */}
              <div className="h-1 bg-fd-border rounded-fd-radius-pill overflow-hidden">
                <div
                  className={`h-full rounded-fd-radius-pill transition-all duration-500 ${
                    phase.status === 'success' ? 'bg-fd-neon-green' :
                    phase.status === 'running' ? 'bg-fd-neon-blue' :
                    phase.status === 'failed' ? 'bg-fd-danger' : 'bg-fd-muted'
                  }`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </MotionWrapper>
  );
};
