
import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RootState, 
  setViewMode, 
  setActiveMappingId, 
  setMappings, 
  setMessages, 
  setPhases, 
  setLedgerEntries, 
  setVerificationResults, 
  addVerificationResult,
  setExecuting,
  setUnsavedChanges,
  setResurrected,
  addLedgerEntry
} from '../store';
import ArtifactPreview from './ArtifactPreview';
import CheckoutSimulation from './CheckoutSimulation';
import AgentSlavkoChat from './AgentSlavkoChat';
import MappingTemplateManager from './MappingTemplateManager';
import DisclosureTable from './DisclosureTable';
import IntelligenceBriefing from './IntelligenceBriefing';
import SystemManifesto from './SystemManifesto';
import SystemIdentity from './SystemIdentity';
import KernelEditor from './KernelEditor';
import InvariantPanel from './InvariantPanel';
import { OPSMapping, KernelState, VerificationResult, AppViewMode } from '../types';
import { verifyCompliance } from '../services/geminiService';
import { jsPDF } from 'https://esm.sh/jspdf@^2.5.1';

import { initWarStack, WarStack } from '../kernel/warstack/warstack';
import { DEFAULT_WARSTACK_CONFIG } from '../kernel/warstack/warstack.config';

const KERNEL_VERSION = 'SlavkoKernel v13.0 (Elite)';

const useWarStack = () => {
  const [ws, setWs] = React.useState<WarStack | null>(null);
  useEffect(() => {
    initWarStack(DEFAULT_WARSTACK_CONFIG).then(setWs);
  }, []);
  return ws;
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const warStack = useWarStack();
  
  const { viewMode, unsavedChanges, resurrected } = useSelector((state: RootState) => state.ui);
  const { entries: ledger } = useSelector((state: RootState) => state.ledger);
  const { messages, phases, mappings, activeMappingId, verificationResults } = useSelector((state: RootState) => state.kernel);

  const ledgerEndRef = useRef<HTMLDivElement>(null);
  const appCorrelationId = useRef(crypto.randomUUID()).current;
  const activeMapping = mappings.find(m => m.id === activeMappingId) || mappings[0];

  const logAndRefresh = useCallback(async (
    data: any
  ) => {
    if (!warStack) return;
    await warStack.log({ correlationId: appCorrelationId, ...data });
    dispatch(setLedgerEntries([...warStack.ledger.getAll()]));
    dispatch(setUnsavedChanges(true));
  }, [warStack, appCorrelationId, dispatch]);

  useEffect(() => {
    if (!warStack) return;
    const saved = localStorage.getItem(warStack.config.persistence.storageKey);
    if (saved) {
      try {
        const state: KernelState = JSON.parse(saved);
        dispatch(setLedgerEntries(state.ledger as any || warStack.ledger.getAll())); 
        dispatch(setMessages(state.messages || []));
        dispatch(setPhases(state.phases || []));
        if (state.mappings) dispatch(setMappings(state.mappings));
        if (state.verificationResults) dispatch(setVerificationResults(state.verificationResults));
        dispatch(setResurrected(true));
        setTimeout(() => dispatch(setResurrected(false)), 2000);
      } catch (e) {
        console.error("RESURRECTION_FAILED: Integrity breach detected in saved state.");
      }
    } else {
       logAndRefresh({ eventType: 'BOOT_INIT', severity: 'INFO', description: 'Kernel boot initialized (Deterministic Mode)', metadata: { component: 'kernel', tier: 'ELITE' } });
    }

    const handleLedgerEvent = () => {
      setTimeout(() => {
          dispatch(setLedgerEntries([...warStack.ledger.getAll()]));
          dispatch(setUnsavedChanges(true));
      }, 50);
    };

    document.addEventListener('ledger-add', handleLedgerEvent);
    return () => document.removeEventListener('ledger-add', handleLedgerEvent);
  }, [warStack, dispatch, logAndRefresh]);

  useEffect(() => {
    if (unsavedChanges && warStack) {
      warStack.persistence.scheduleSave(async () => {
        const state: KernelState = {
          ledger,
          messages,
          phases,
          mappings,
          selectedMappingId: activeMappingId,
          verificationResults,
          lastTick: new Date().toISOString(),
          kernelVersion: KERNEL_VERSION,
          rngSeed: 42,
          lastSaved: new Date().toISOString(),
          unsavedChanges: false,
          retryCount: 0
        };
        localStorage.setItem(warStack.config.persistence.storageKey, JSON.stringify(state));
        dispatch(setUnsavedChanges(false));
        await logAndRefresh({ eventType: 'STATE_PERSISTED', severity: 'INFO', description: 'STATE_PERSISTED: Snapshot synchronized' });
      });
    }
  }, [ledger, messages, phases, mappings, activeMappingId, verificationResults, unsavedChanges, warStack, logAndRefresh, dispatch]);

  useEffect(() => {
    ledgerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ledger]);

  const handleVerifyCompliance = async () => {
    if (!activeMapping || !warStack) return;
    dispatch(setExecuting(true));
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

      dispatch(addVerificationResult(vResult));
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
      dispatch(setExecuting(false));
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
        <div className="w-8 h-8 border-4 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
        <p className="ml-4 text-[#444] font-mono">INITIALIZING SLAVKOKERNEL v13.0...</p>
      </div>
    );
  }

  const navModes: AppViewMode[] = ['chat', 'briefing', 'disclosure', 'checkout', 'template', 'editor', 'manifesto'];

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-[var(--signal-muted)]">
       {resurrected && (
        <div className="fixed top-4 right-4 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full z-50 animate-fadeInUp">
          Kernel State Resurrected
        </div>
      )}
      <header className="border-b border-[#111] bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-8 h-8 bg-[#00ff41] flex items-center justify-center font-black text-[12px] text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]">FD</div>
            <SystemIdentity kernelVersion="V13.0_ELITE" instanceId="OPS-INT-2025" status="ACTIVE" />
          </div>
          
          <nav className="flex items-center gap-px bg-[#050505] p-0.5 rounded-sm border border-[#111] overflow-x-auto no-scrollbar max-w-[50%]">
            {navModes.map(mode => (
              <button 
                key={mode} 
                onClick={() => dispatch(setViewMode(mode))}
                className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                  viewMode === mode ? 'bg-[#00ff41] text-black' : 'text-[#444] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <button onClick={generatePDFReport} className="text-[#333] hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0 bg-black">
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-black border border-[#111] rounded-sm flex flex-col h-[520px] overflow-hidden shadow-[0_0_20px_rgba(0,0,0,1)]">
            <div className="px-5 py-3 border-b border-[#111] flex justify-between items-center bg-[#030303]">
              <span className="text-[8px] font-black text-[#444] uppercase tracking-[0.4em]">Audit_Ledger</span>
              <div className="w-1 h-1 rounded-full bg-[#00ff41] animate-pulse shadow-[0_0_4px_#00ff41]" />
            </div>
            <div className="flex-1 overflow-y-auto p-5 font-mono text-[9px] space-y-5">
              {ledger.length === 0 && <p className="text-[#222] italic">Buffer_Ready...</p>}
              {ledger.map((entry) => (
                <div key={entry.id} className="flex gap-3 animate-entry">
                  <span className="text-[#222] shrink-0">[{entry.timestampISO.split('T')[1].split('.')[0]}]</span>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className={`shrink-0 font-black text-[7px] uppercase tracking-tighter ${
                      entry.severity === 'SUCCESS' ? 'text-[#00ff41]' : entry.severity === 'CRITICAL' ? 'text-[#ff3131]' : 'text-[#444]'
                    }`}>{entry.eventType}</span>
                    <span className="text-[#666] leading-tight">{entry.description}</span>
                  </div>
                </div>
              ))}
              <div ref={ledgerEndRef} />
            </div>
          </div>
          
          <button onClick={handleVerifyCompliance} disabled={viewMode !== 'chat'} className="w-full py-4 bg-[#050505] border border-[#111] text-[9px] font-black uppercase tracking-[0.4em] text-[#00ff41] hover:bg-[#111] transition-all disabled:opacity-20">
            Verify Artifact Integrity
          </button>
        </aside>

        <div className="lg:col-span-9 h-auto min-h-[700px] bg-black">
          {viewMode === 'chat' && <AgentSlavkoChat />}
          {viewMode === 'briefing' && <IntelligenceBriefing />}
          {viewMode === 'disclosure' && (
            <DisclosureTable 
              mappings={mappings} 
              activeId={activeMappingId} 
              onSelect={id => dispatch(setActiveMappingId(id))} 
            />
          )}
          {viewMode === 'checkout' && <CheckoutSimulation />}
          {viewMode === 'manifesto' && <SystemManifesto />}
          {viewMode === 'editor' && <KernelEditor />}
          {viewMode === 'template' && (
            <MappingTemplateManager 
              mappings={mappings} 
              activeId={activeMappingId}
              onSelect={id => dispatch(setActiveMappingId(id))}
              onAddMapping={m => dispatch(setMappings([...mappings, m]))}
              onRemoveMapping={id => dispatch(setMappings(mappings.filter(m => m.id !== id)))}
            />
          )}
        </div>
      </main>
      
      <footer className="border-t border-[#0a0a0a] p-5 text-center bg-black">
        <p className="text-[7px] text-[#222] uppercase tracking-[0.8em] font-black">STABLE_ARCHITECTURE // DISCIPLINE_KERNEL</p>
      </footer>
      
      <InvariantPanel />
    </div>
  );
};

export default App;
