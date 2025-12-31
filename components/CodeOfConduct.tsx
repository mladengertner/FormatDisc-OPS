
import React from 'react';
import { SimulationEthics } from '../types';

const PRINCIPLES: SimulationEthics[] = [
  {
    id: 'coc-1',
    principle: 'Architectural Grounding',
    description: 'Every interactive element must map to a specific OPS artifact. Visuals without logic are prohibited.',
    example: 'A checkout button must trigger a documented API handshake, not just a static "Success" screen.',
    severity: 'Strict'
  },
  {
    id: 'coc-2',
    principle: 'Relational Integrity',
    description: 'Generated data must maintain UUID-level relational consistency as defined in the Data Model.',
    example: 'An Order ID must correctly reference the User ID that initiated the transaction throughout the lifecycle.',
    severity: 'Strict'
  },
  {
    id: 'coc-3',
    principle: 'Logic Transparency',
    description: 'Calculations in simulation must use the same formulas defined in Business Logic Spec.',
    example: 'Tax and discount calculations must match the JS snippets provided in the technical documentation.',
    severity: 'Strict'
  },
  {
    id: 'coc-4',
    principle: 'Latency Honesty',
    description: 'Asynchronous operations must simulate realistic network delays to demonstrate loading states and error handling.',
    example: 'Payment processing must include a loading spinner and 1-2s delay to mirror real-world API behavior.',
    severity: 'Guideline'
  }
];

const CodeOfConduct: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="border-l-4 border-fd-danger pl-6 py-2">
        <h2 className="text-lg font-bold text-white tracking-tight">Simulation Code of Conduct</h2>
        <p className="text-fd-muted text-sm mt-1 uppercase tracking-[0.2em] font-medium">Framework for Simulation Integrity</p>
      </div>

      <div className="grid gap-6">
        {PRINCIPLES.map((p) => (
          <div key={p.id} className="bg-fd-panel border border-fd-border rounded-xl p-6 hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="text-fd-faint font-mono text-xs">{p.id}</span>
                <h3 className="text-base font-bold text-fd-text group-hover:text-fd-neon-blue transition-colors">{p.principle}</h3>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest ${
                p.severity === 'Strict' ? 'bg-fd-danger/10 text-fd-danger' : 'bg-fd-neon-yellow/10 text-fd-neon-yellow'
              }`}>
                {p.severity}
              </span>
            </div>
            
            <p className="text-fd-muted text-sm leading-relaxed mb-4">
              {p.description}
            </p>

            <div className="bg-fd-panel2 border border-fd-border rounded-lg p-3">
              <span className="text-[10px] font-bold text-fd-muted uppercase tracking-widest block mb-1">Operational Example</span>
              <p className="text-xs text-fd-text italic">"{p.example}"</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-fd-neon-blue/5 border border-fd-neon-blue/20 rounded-xl p-8 text-center space-y-4">
        <h4 className="text-white font-bold">Standard Disclosure Requirement</h4>
        <p className="text-fd-muted text-sm max-w-2xl mx-auto italic">
          "This simulation is a verified expression of FormatDisc OPS v12.6. 
          All logical transitions are grounded in architectural truth. 
          Visual components represent 1:1 intended production functionality."
        </p>
        <div className="pt-4">
          <button className="px-6 py-2 bg-zinc-100 text-black text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-white transition-all">
            Download Formal PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeOfConduct;