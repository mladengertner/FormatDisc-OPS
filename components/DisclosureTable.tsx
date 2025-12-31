
import React from 'react';
import { OPSMapping } from '../types';
import { MotionWrapper } from './MotionWrapper';

interface Props {
  mappings: OPSMapping[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

const DisclosureTable: React.FC<Props> = ({ mappings, activeId, onSelect }) => {
  return (
    <MotionWrapper state="entering" className="h-full flex flex-col">
      <header className="flex justify-between items-end border-b border-[#222] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--bone)] tracking-tight">OPS Artifact Map</h2>
          <p className="text-xs text-[var(--fd-muted)] mt-2 font-mono uppercase tracking-widest">Architectural Verification Ledger</p>
        </div>
      </header>

      <div className="bg-[#000000] border border-[#222] rounded-lg overflow-hidden flex-1 shadow-soft">
        <div className="overflow-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#050505] sticky top-0 z-10 border-b border-[#222]">
              <tr>
                <th className="p-5 text-[10px] font-bold text-[var(--fd-muted)] uppercase tracking-[0.2em]">Artifact</th>
                <th className="p-5 text-[10px] font-bold text-[var(--fd-muted)] uppercase tracking-[0.2em]">Node</th>
                <th className="p-5 text-[10px] font-bold text-[var(--fd-muted)] uppercase tracking-[0.2em]">Stack</th>
                <th className="p-5 text-[10px] font-bold text-[var(--fd-muted)] uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fd-border)]">
              {mappings.map((map) => {
                const isActive = activeId === map.id;
                return (
                  <tr 
                    key={map.id} 
                    onClick={() => onSelect?.(map.id)}
                    className={`
                      cursor-pointer transition-colors duration-300 group
                      ${isActive ? 'bg-[#0a0a0a]' : 'hover:bg-[#050505]'}
                    `}
                  >
                    <td className="p-5 align-top">
                      <div className={`font-bold text-sm mb-1 ${isActive ? 'text-[var(--signal)]' : 'text-[var(--bone)]'}`}>
                        {map.artifact.title}
                      </div>
                      <span className="text-[10px] text-[var(--fd-muted)] font-mono uppercase tracking-wide">
                        {map.artifact.type}
                      </span>
                    </td>
                    
                    <td className="p-5 align-top">
                      <div className="text-sm font-medium text-[var(--fd-text)]">{map.component.title}</div>
                      <div className="text-xs text-[var(--fd-muted)] mt-1 line-clamp-1">{map.component.description}</div>
                    </td>

                    <td className="p-5 align-top">
                      <span className="text-xs font-mono text-[var(--fd-muted)] bg-black px-2 py-1 rounded border border-[#222]">
                        {map.component.technology}
                      </span>
                    </td>

                    <td className="p-5 align-top">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${map.component.simulationStatus === 'Functional' ? 'bg-[var(--signal)]' : 'bg-[var(--fd-muted)]'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--fd-muted)]">
                          {map.component.simulationStatus}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MotionWrapper>
  );
};

export default DisclosureTable;
