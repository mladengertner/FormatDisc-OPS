import React from 'react';
import { useWarStack } from '../context/WarStackContext';
import { MotionWrapper } from './MotionWrapper';

export const LedgerPanel: React.FC = () => {
  const { ledgerEntries, state } = useWarStack();
  const recentEntries = [...ledgerEntries].reverse().slice(0, 50);

  return (
    <MotionWrapper state={state.status === 'LOADING' ? 'changing' : 'entering'} className="bg-[var(--fd-panel)] border border-[var(--fd-border)] rounded-md h-full flex flex-col overflow-hidden transition-all duration-500">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--fd-border)] flex items-center justify-between bg-[var(--fd-panel2)]">
        <div className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--fd-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
           <h2 className="text-sm font-semibold text-[var(--fd-text)]">System Ledger</h2>
        </div>
        <div className="text-xs font-mono text-[var(--fd-muted)]">
            State: {state.mode}
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto bg-[var(--fd-bg)]">
        {recentEntries.length === 0 ? (
          <div className="p-8 text-center text-[var(--fd-muted)] text-sm">
            No events recorded.
          </div>
        ) : (
          <div className="font-mono text-xs">
            {recentEntries.map((entry, index) => (
              <div 
                key={entry.id}
                data-state="entering"
                className={`flex gap-4 p-2 border-b border-[var(--fd-border)] hover:bg-[var(--fd-panel2)] transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--fd-panel)]/30'}`}
              >
                <div className="text-[var(--fd-faint)] w-16 shrink-0 select-none">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                </div>
                
                <div className={`w-20 shrink-0 font-bold ${
                    entry.event.type === 'LOG' && entry.event.payload.severity === 'SUCCESS' ? 'text-[var(--fd-neon-green)]' : 
                    entry.event.type === 'LOG' && entry.event.payload.severity === 'CRITICAL' ? 'text-[var(--fd-danger)]' :
                    'text-[var(--fd-neon-blue)]'
                }`}>
                  {entry.event.type}
                </div>

                <div className="flex-1 text-[var(--fd-text)] break-all truncate">
                  {entry.event.type === 'COMMAND' && `CMD: ${entry.event.payload.name}`}
                  {entry.event.type === 'LOG' && entry.event.payload.description}
                  {entry.event.type === 'INIT' && `Initialized (Seed: ${entry.event.payload.seed})`}
                  {entry.event.type === 'MODE_SWITCH' && `Switch -> ${entry.event.payload.mode}`}
                </div>

                <div className="w-12 shrink-0 text-[var(--fd-faint)] text-right opacity-50">
                  {entry.hash.substring(0, 4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--fd-border)] bg-[var(--fd-panel)] text-[10px] text-[var(--fd-muted)] flex justify-between items-center">
         <span>Total Events: {ledgerEntries.length}</span>
         {state.status === 'RECOVERY' && <span className="text-fd-neon-blue animate-pulse font-bold">RECOVERY SEQUENCE...</span>}
      </div>
    </MotionWrapper>
  );
};
