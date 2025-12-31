import React from 'react';

const SystemManifesto: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fadeInUp p-6 md:p-12">
      <header className="border-b border-fd-border pb-8">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-fd-neon-green rounded-full animate-pulse shadow-neon-green" />
            <span className="text-xs font-black text-fd-neon-green uppercase tracking-widest">System Status: Confirmed</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-3">SlavkoKernel <span className="text-fd-neon-blue">War Stack v13.0</span></h1>
        <p className="text-sm text-fd-muted font-mono uppercase tracking-widest">Institutional-Grade Execution Kernel &bull; Elite Tier</p>
      </header>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-8">
            <Section title="Operational Readiness">
                <ul className="space-y-4">
                    <Item title="Deterministic Control" desc="Reproducibility guarantees audit replay and forensic traceability." />
                    <Item title="Audit-Grade Ledger" desc="Hash-chained, append-only logging meets regulatory and evidentiary standards." />
                    <Item title="Multi-Model Fusion" desc="Consensus weighting eliminates single-provider epistemic risk." />
                    <Item title="XP & Scoring" desc="Behavioral telemetry converted into enforceable heuristics, not vanity metrics." />
                </ul>
            </Section>
             <Section title="Secure Architecture">
                <ul className="space-y-4">
                     <Item title="Secure Protocol" desc="mTLS + E2EE establishes zero-trust transport by default." />
                     <Item title="Live Contracts" desc="Type-safe specifications act as executable law, not documentation." />
                     <Item title="Resilience" desc="Auto-recovery paths preserve continuity under fault and adversarial conditions." />
                </ul>
            </Section>
        </div>

        <div className="space-y-8">
            <Section title="Institutional Signal" highlight>
                <p className="text-sm text-fd-text leading-relaxed mb-6 font-medium">
                    This stack communicates <strong className="text-white">control, verifiability, and survivability</strong>.
                    It is designed for environments where failure is not an option.
                </p>
                <div className="bg-fd-panel2/50 rounded-xl p-5 border border-fd-border">
                    <h4 className="text-[10px] text-fd-muted uppercase tracking-widest font-black mb-3">Deployment Targets</h4>
                    <ul className="grid grid-cols-1 gap-2 text-xs text-fd-text font-mono">
                        <li className="flex items-center gap-2"><span className="w-1 h-1 bg-fd-neon-blue rounded-full"></span>Regulated environments</li>
                        <li className="flex items-center gap-2"><span className="w-1 h-1 bg-fd-neon-blue rounded-full"></span>Audit-facing deployments</li>
                        <li className="flex items-center gap-2"><span className="w-1 h-1 bg-fd-neon-blue rounded-full"></span>High-risk operational theaters</li>
                        <li className="flex items-center gap-2"><span className="w-1 h-1 bg-fd-neon-blue rounded-full"></span>Long-lived institutional systems</li>
                    </ul>
                </div>
                <div className="mt-8 p-6 bg-black/40 border border-fd-border rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-fd-neon-blue"></div>
                    <p className="text-sm text-fd-muted italic leading-relaxed font-serif">
                        "No ornamental features. No speculative abstractions. Everything here is governed, enforceable, and replayable."
                    </p>
                </div>
            </Section>

            <Section title="War Mode: Active">
                <div className="flex items-center gap-5 p-5 bg-fd-danger/10 border border-fd-danger/30 rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <div className="w-10 h-10 flex items-center justify-center bg-fd-danger/20 rounded-xl shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-fd-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-fd-danger uppercase tracking-widest">Formal Disclosure Alignment</h4>
                        <p className="text-xs text-fd-muted mt-1 leading-relaxed">OPS → Simulation → Ledger → Contract surface.</p>
                        <p className="text-[10px] text-fd-danger/70 mt-2 font-mono uppercase tracking-tight">Ready to be judged, not explained.</p>
                    </div>
                </div>
            </Section>
        </div>
      </div>

      <footer className="pt-12 mt-8 border-t border-fd-border flex flex-col items-end opacity-90 hover:opacity-100 transition-opacity">
        <div className="text-right">
            <div className="text-3xl font-serif italic text-white mb-2">Mladen Gertner</div>
            <div className="text-[10px] text-fd-neon-blue uppercase tracking-[0.2em] font-black">System Architect — Orchestrator of Systems</div>
            <div className="text-[10px] text-fd-faint uppercase tracking-[0.2em] mt-1">Guardian of Integrity</div>
            <div className="text-[9px] text-fd-faint mt-4 font-mono">FormatDisc vl., © 2025 FormatDisc, All Rights Reserved</div>
        </div>
      </footer>
    </div>
  );
};

const Section: React.FC<{ title: string, children: React.ReactNode, highlight?: boolean }> = ({ title, children, highlight }) => (
    <div className={`rounded-3xl p-8 border transition-all duration-500 ${highlight ? 'bg-fd-panel2/30 border-fd-neon-blue/20 shadow-neon-blue' : 'bg-fd-panel border-fd-border shadow-soft hover:border-fd-border/80'}`}>
        <h3 className={`text-xs font-black uppercase tracking-[0.22em] mb-6 ${highlight ? 'text-fd-neon-blue' : 'text-fd-muted'}`}>{title}</h3>
        {children}
    </div>
);

const Item: React.FC<{ title: string, desc: string }> = ({ title, desc }) => (
    <li className="flex flex-col gap-1.5 pb-2">
        <span className="text-sm font-bold text-white tracking-tight">{title}</span>
        <span className="text-xs text-fd-muted leading-relaxed border-l-2 border-fd-border pl-3">{desc}</span>
    </li>
);

export default SystemManifesto;