import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_MAPPINGS } from './constants';
import ArtifactPreview from './components/ArtifactPreview';
import CheckoutSimulation from './components/CheckoutSimulation';
import AgentSlavkoChat from './components/AgentSlavkoChat';
import MappingTemplateManager from './components/MappingTemplateManager';
import CodeOfConduct from './components/CodeOfConduct';
import DisclosureTable from './components/DisclosureTable';
import IntelligenceBriefing from './components/IntelligenceBriefing';
import SystemManifesto from './components/SystemManifesto';
import LogoGenerator from './components/LogoGenerator';
import { OPSMapping, LedgerEntry, ChatMessage, PipelinePhase, KernelState, VerificationResult } from './types';
import { verifyCompliance } from './services/geminiService';
import { jsPDF } from 'https://esm.sh/jspdf@^2.5.1';

import { initWarStack, WarStack } from './kernel/warstack/warstack';
import { DEFAULT_WARSTACK_CONFIG } from './kernel/warstack/warstack.config';

const KERNEL_VERSION = 'SlavkoKernel v13.0 (Elite)';

const useWarStack = () => {
  const [ws, setWs] = useState<WarStack | null>(null);
  useEffect(() => {
    initWarStack(DEFAULT_WARSTACK_CONFIG).then(setWs);
  }, []);
  return ws;
};

const INITIAL_PHASES: PipelinePhase[] = [
  { id: 1, name: 'Klijent Zahtjev (Scope Lock)', duration: '2h', status: 'pending', opsRef: 'art-001' },
  { id: 2, name: 'MVP Simulacija (Sandbox Zagreb)', duration: '8h', status: 'pending', opsRef: 'art-005' },
  { id: 3, name: 'SlavkoKernel Orkestracija', duration: '8h', status: 'pending', opsRef: 'art-006' },
  { id: 4, name: 'Compliance Gate (GDPR/SOC2)', duration: '6h', status: 'pending', opsRef: 'art-004' },
  { id: 5, name: 'Produkcija (Zero-Downtime)', duration: '24h', status: 'pending', opsRef: 'art-001' }
];

const App: React.FC = () => {
  const warStack = useWarStack();
  const [mappings, setMappings] = useState<OPSMapping[]>(INITIAL_MAPPINGS);
  const [activeMappingIndex, setActiveMappingIndex] = useState(0);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'checkout' | 'template' | 'disclosure' | 'briefing' | 'manifesto'>('chat');
  
  const [ledger, setLedger] = useState<ReadonlyArray<LedgerEntry>>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phases, setPhases] = useState<PipelinePhase[]>(INITIAL_PHASES);
  const [resurrected, setResurrected] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [ledgerPulse, setLedgerPulse] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  
  const ledgerEndRef = useRef<HTMLDivElement>(null);
  const appCorrelationId = useRef(crypto.randomUUID()).current;
  const activeMapping = mappings[activeMappingIndex] || mappings[0];

  const logAndRefresh = useCallback(async (
    data: Omit<Parameters<WarStack['log']>[0], 'correlationId'> & { correlationId?: string }
  ) => {
    if (!warStack) return;
    await warStack.log({ correlationId: appCorrelationId, ...data });
    setLedger([...warStack.ledger.getAll()]);
    setLedgerPulse(true);
    setTimeout(() => setLedgerPulse(false), 1200);
    setUnsavedChanges(true);
  }, [warStack, appCorrelationId]);


  useEffect(() => {
    if (!warStack) return;
    const saved = localStorage.getItem(warStack.config.persistence.storageKey);
    if (saved) {
      try {
        const state: KernelState = JSON.parse(saved);
        // This is a simplified resurrection. A real one would re-populate the ledger store.
        setLedger(state.ledger || warStack.ledger.getAll()); 
        setMessages(state.messages || []);
        setPhases(state.phases || INITIAL_PHASES);
        if (state.mappings) setMappings(state.mappings);
        if (state.verificationResults) setVerificationResults(state.verificationResults);
        setResurrected(true);
        setTimeout(() => setResurrected(false), 2000);
      } catch (e) {
        console.error("RESURRECTION_FAILED: Integrity breach detected in saved state.");
      }
    } else {
      setMessages([
        { id: '1', role: 'agent', text: 'SlavkoKernel v13.0 (Elite) operativan. Multi-agent fusion engine ready. Čekam arhitektonski nalog.', timestamp: new Date().toISOString() }
      ]);
       logAndRefresh({ eventType: 'BOOT_INIT', severity: 'INFO', description: 'Kernel boot initialized (Deterministic Mode)', metadata: { component: 'kernel', tier: 'ELITE' } });
    }

    // Listen for Elite Kernel events that update the ledger autonomously
    const handleLedgerEvent = (e: any) => {
      // Small delay to ensure the ledger store has processed the event
      setTimeout(() => {
          setLedger([...warStack.ledger.getAll()]);
          setLedgerPulse(true);
          setTimeout(() => setLedgerPulse(false), 1200);
          setUnsavedChanges(true);
      }, 50);
    };

    document.addEventListener('ledger-add', handleLedgerEvent);
    return () => document.removeEventListener('ledger-add', handleLedgerEvent);

  }, [warStack]);

  useEffect(() => {
    if (unsavedChanges && warStack) {
      warStack.persistence.scheduleSave(async () => {
        const state: KernelState = {
          ledger,
          messages,
          phases,
          mappings,
          selectedMappingId: activeMapping?.id,
          verificationResults,
          lastTick: new Date().toISOString(),
          kernelVersion: KERNEL_VERSION,
          rngSeed: 42,
          lastSaved: new Date().toISOString(),
          unsavedChanges: false,
          retryCount: 0
        };
        localStorage.setItem(warStack.config.persistence.storageKey, JSON.stringify(state));
        setUnsavedChanges(false);
        await logAndRefresh({ eventType: 'STATE_PERSISTED', severity: 'INFO', description: 'STATE_PERSISTED: Snapshot synchronized' });
      });
    }
  }, [ledger, messages, phases, mappings, activeMapping, verificationResults, unsavedChanges, warStack, logAndRefresh]);

  useEffect(() => {
    ledgerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ledger]);


  const handleMappingSelect = (id: string) => {
    const idx = mappings.findIndex(m => m.id === id);
    if (idx !== -1) {
      setActiveMappingIndex(idx);
      logAndRefresh({ eventType: 'CONTEXT_SHIFT', severity: 'INFO', description: `CONTEXT_SHIFT: Focus moved to ${id.slice(0, 8)}`, metadata: { mappingId: id } });
    }
  };

  const handleVerifyCompliance = async () => {
    if (!activeMapping || !warStack) return;
    setIsVerifying(true);
    const correlationId = warStack.ids.nextId();
    
    const simContext = `Component: ${activeMapping.component.title} Criteria: ${activeMapping.component.verificationCriteria}`;

    try {
      const apiResult = await warStack.aiCall(correlationId, activeMapping.id, () => 
        verifyCompliance(activeMapping.artifact.content, simContext)
      );
      
      const vResult: VerificationResult = {
        compliant: apiResult.compliant,
        verdict: apiResult.compliant ? 'PASS' : 'FAIL',
        verdictMessage: apiResult.verdict,
        discrepancies: (apiResult.discrepancies || []).map((d: string) => ({ message: d, severity: 'HIGH' })),
        auditedMappingId: activeMapping.id,
        timestamp: new Date().toISOString(),
        verifierId: 'slavko-auditor'
      };

      setVerificationResults(prev => [vResult, ...prev]);
      logAndRefresh({
        eventType: 'AI_RESPONSE',
        severity: vResult.compliant ? 'SUCCESS' : 'CRITICAL',
        description: `AI_RESPONSE: Integrity ${vResult.compliant ? 'Confirmed' : 'Breach'}`,
        correlationId,
        metadata: { mappingId: activeMapping.id }
      });
    } catch (error: any) {
      logAndRefresh({ eventType: 'ERROR', severity: 'CRITICAL', description: `AI_ERROR: ${error.message}`, correlationId, metadata: { errorCategory: 'UNKNOWN' } });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const generatePDFReport = () => {
    logAndRefresh({ eventType: 'REPORT_GENERATED', severity: 'INFO', description: 'REPORT_GEN: Initiating PDF compilation' });
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 12);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`FORMATDISC | AUDIT REPORT v13.0 ELITE`, 20, 25);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let y = 50;
    ledger.slice(-20).forEach(l => {
      doc.text(`[${l.eventType}] ${l.description.slice(0, 70)}`, 20, y);
      y += 6;
    });
    doc.save(`Audit_${Date.now()}.pdf`);
    logAndRefresh({ eventType: 'REPORT_GENERATED', severity: 'SUCCESS', description: 'REPORT_GEN: Compilation successful' });
  };

  if (!warStack) {
    return (
      <div className="min-h-screen bg-fd-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-fd-neon-blue border-t-transparent rounded-full animate-spin" />
        <p className="ml-4 text-fd-muted font-mono">INITIALIZING SLAVKOKERNEL v13.0...</p>
      </div>
    );
  }

  const isSidebarVisible = viewMode !== 'disclosure' && viewMode !== 'briefing' && viewMode !== 'manifesto';

  return (
    <div className={`min-h-screen bg-fd-bg flex flex-col font-sans selection:bg-fd-neon-blue/30`}>
       {resurrected && (
        <div className="absolute top-4 right-4 bg-fd-neon-green/10 border border-fd-neon-green/30 text-fd-neon-green text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full z-50 animate-fadeInUp">
          Kernel State Resurrected
        </div>
      )}
      <header className="border-b border-fd-border bg-fd-panel/60 backdrop-blur-xl sticky top-0 z-40 group">
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-t from-transparent to-fd-neon-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-fd-neon-blue rounded flex items-center justify-center font-black text-white shadow-neon-blue">FD</div>
            <div className="hidden sm:block text-left">
              <h1 className="text-xs font-black tracking-tight text-white uppercase">SlavkoKernel</h1>
              <p className="text-[9px] text-fd-faint uppercase tracking-[0.22em] leading-none">{KERNEL_VERSION}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 bg-fd-panel2/50 p-1 rounded-xl border border-fd-border overflow-x-auto max-w-[50vw] sm:max-w-none no-scrollbar">
            {['chat', 'briefing', 'disclosure', 'checkout', 'template', 'manifesto'].map(mode => (
              <button 
                key={mode} 
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.22em] transition-all whitespace-nowrap ${
                  viewMode === mode ? 'bg-fd-neon-blue text-white shadow-lg shadow-blue-900/20' : 'text-fd-muted hover:text-fd-text'
                }`}
              >
                {mode}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsLogoModalOpen(true)} className="p-2 text-fd-muted hover:text-white transition-colors" title="Generate AI Logo">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5zM18.4 5.6c.2-.2.5-.2.7 0 .2.2.2.5 0 .7l-2.1 2.1c-.2.2-.5.2-.7 0s-.2-.5 0-.7l2.1-2.1zM21 12c0-.3.2-.5.5-.5s.5.2.5.5h-1zM18.4 18.4c-.2.2-.2.5 0 .7.2.2.5.2.7 0l2.1-2.1c.2-.2.2-.5 0-.7s-.5-.2-.7 0l-2.1 2.1zM12 21c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5s.5.2.5.5v3c0 .3-.2-.5.5zM5.6 18.4c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7l2.1 2.1c.2.2.5.2.7 0s.2-.5 0-.7l-2.1-2.1zM3 12c0 .3-.2.5-.5.5S2 12.3 2 12h1zM5.6 5.6c.2.2.2.5 0 .7s-.5.2-.7 0L2.8 4.2c-.2-.2-.2-.5 0-.7s.5-.2.7 0l2.1 2.1zM12 8c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z"/></svg>
             </button>
             <button onClick={generatePDFReport} className="p-2 text-fd-muted hover:text-white transition-colors" title="Download Report">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
             </button>
             {unsavedChanges && <div className="w-2 h-2 rounded-full bg-fd-neon-blue animate-pulse shadow-neon-blue" title="Unsaved Changes"/>}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {isSidebarVisible && (
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <div className={`bg-fd-panel border border-fd-border rounded-3xl flex flex-col h-[600px] shadow-soft overflow-hidden group transition-all ${ledgerPulse ? 'shadow-neon-blue' : ''}`}>
              <div className="px-6 py-4 border-b border-fd-border bg-fd-panel2/20 flex justify-between items-center">
                <span className="text-[10px] font-black text-fd-muted uppercase tracking-[0.22em]">Neural Audit Ledger</span>
                <span className="text-[8px] text-fd-faint font-mono flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-fd-neon-green animate-pulse" />
                  DETERMINISTIC_ACTIVE
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-4">
                {ledger.map((entry) => (
                  <div key={entry.id} className="flex gap-4 group/item hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded transition-colors animate-fadeInUp">
                    <span className="text-fd-faint shrink-0 font-medium">[{entry.timestampISO.split('T')[1].split('.')[0]}]</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className={`shrink-0 font-black text-[9px] uppercase tracking-tighter ${
                        entry.severity === 'SUCCESS' ? 'text-fd-neon-green' : 
                        entry.severity === 'CRITICAL' ? 'text-fd-danger' : 
                        entry.severity === 'WARN' ? 'text-fd-neon-yellow' : 'text-fd-muted'
                      }`}>{entry.eventType}</span>
                      <span className="text-fd-text leading-relaxed">{entry.description}</span>
                    </div>
                  </div>
                ))}
                <div ref={ledgerEndRef} />
              </div>
            </div>
          </aside>
        )}

        <div className={`${isSidebarVisible ? 'lg:col-span-8' : 'lg:col-span-12'} h-auto min-h-[800px]`}>
          {viewMode === 'chat' && (
            <AgentSlavkoChat 
              warStack={warStack}
              logAndRefresh={logAndRefresh} 
              messages={messages} 
              setMessages={(m) => { setMessages(m); setUnsavedChanges(true); }} 
              phases={phases} 
              setPhases={(p) => { setPhases(p); setUnsavedChanges(true); }} 
              activeMapping={activeMapping}
            />
          )}
          {viewMode === 'briefing' && <IntelligenceBriefing />}
          {viewMode === 'disclosure' && <DisclosureTable mappings={mappings} activeId={activeMapping.id} onSelect={handleMappingSelect} />}
          {viewMode === 'checkout' && <div className="h-full bg-fd-panel border border-fd-border rounded-3xl p-8 overflow-hidden"><CheckoutSimulation /></div>}
          {viewMode === 'manifesto' && <SystemManifesto />}
          {viewMode === 'template' && (
            <MappingTemplateManager 
              mappings={mappings} 
              activeId={activeMapping.id}
              onSelect={handleMappingSelect}
              onAddMapping={m => { setMappings([...mappings, m]); setUnsavedChanges(true); logAndRefresh({ eventType: 'BLUEPRINT_COMMIT', severity: 'SUCCESS', description: `BLUEPRINT_COMMIT: ${m.artifact.title}` }); }} 
              onRemoveMapping={id => { setMappings(mappings.filter(m => m.id !== id)); setUnsavedChanges(true); logAndRefresh({ eventType: 'BLUEPRINT_PURGE', severity: 'WARN', description: `BLUEPRINT_PURGE: ${id.slice(0,8)}` }); }} 
            />
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-fd-border p-6 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-fd-neon-blue animate-pulse" />
          <p className="text-[9px] text-fd-faint uppercase tracking-[0.4em] font-black">Immutable Core &bull; Deterministic {KERNEL_VERSION}</p>
        </div>
      </footer>
      
      {isLogoModalOpen && <LogoGenerator onClose={() => setIsLogoModalOpen(false)} />}
    </div>
  );
};

export default App;