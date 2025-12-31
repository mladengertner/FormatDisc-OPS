import React from 'react';
import { useUIState } from '../context/UIStateContext';
import { useWarStack } from '../context/WarStackContext';

const tabs = [
  { id: 'chat', label: 'Command' },
  { id: 'table', label: 'Ledger' },
  { id: 'components', label: 'Nodes' },
  { id: 'designer', label: 'Blueprint' },
  { id: 'ethics', label: 'Protocol' },
] as const;

export const Header: React.FC = () => {
  const { state: uiState, dispatch } = useUIState();
  const { generateReport } = useWarStack();

  const handleTabClick = (id: any) => {
    dispatch({ type: 'SWITCH_VIEW', payload: id });
  };

  return (
    <header className="bg-[var(--ink)] border-b border-subtle sticky top-0 z-50">
      <div className="px-6 h-16 flex items-center justify-between max-w-[1920px] mx-auto">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-4 animate-enter">
          <div className="w-8 h-8 bg-[var(--bone)] rounded-sm flex items-center justify-center text-[var(--ink)] font-bold text-sm tracking-tighter interact-click cursor-pointer hover:scale-105 transition-transform">
            FD
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--bone)] leading-none tracking-tight">OPS Integrator</h1>
            <span className="text-[10px] text-[var(--fd-muted)] font-mono tracking-widest">v13.0 ELITE</span>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav className="hidden lg:flex items-center h-full gap-8 animate-enter" style={{ animationDelay: '100ms' }}>
          {tabs.map((tab) => {
            const isActive = uiState.viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  relative h-full flex items-center text-xs font-bold uppercase tracking-widest transition-colors duration-300
                  ${isActive ? 'text-[var(--signal)]' : 'text-[var(--fd-muted)] hover:text-[var(--bone)]'}
                `}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--signal)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 animate-enter" style={{ animationDelay: '200ms' }}>
          <button 
            onClick={() => generateReport()}
            className="interact-click interact-hover px-4 py-2 bg-layer-1 border border-subtle hover:border-[var(--bone)] text-[var(--bone)] text-xs font-bold uppercase tracking-widest rounded-md"
          >
            Export
          </button>
          <div className="w-8 h-8 rounded-full bg-layer-2 border border-subtle flex items-center justify-center text-[var(--fd-muted)] text-xs font-bold interact-hover cursor-pointer">
            US
          </div>
        </div>
      </div>
    </header>
  );
};
