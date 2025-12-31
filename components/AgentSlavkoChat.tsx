
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addMessage, updatePhase, setExecuting, addLedgerEntry } from '../store';
import { ChatMessage, OPSMapping, PipelinePhase } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useMotionKernel, initMotionGL, setupBuffersGL, drawMotionGL, EventSignal, snap025 } from '../kernel/motion/kernel';
import { WarStack } from '../kernel/warstack/warstack';

// FIX: Define Props interface to match the usage in App.tsx (v12.6/v13 hybrid)
interface AgentSlavkoChatProps {
  warStack?: WarStack;
  logAndRefresh?: (data: any) => Promise<void>;
  messages?: ChatMessage[];
  setMessages?: (messages: ChatMessage[]) => void;
  phases?: PipelinePhase[];
  setPhases?: (phases: PipelinePhase[]) => void;
  activeMapping?: OPSMapping;
}

const AgentSlavkoChat: React.FC<AgentSlavkoChatProps> = ({
  warStack,
  logAndRefresh,
  messages: propsMessages,
  setMessages: propsSetMessages,
  phases: propsPhases,
  setPhases: propsSetPhases,
  activeMapping: propsActiveMapping
}) => {
  const dispatch = useDispatch();
  
  // FIX: Support both direct props (from earlier App versions) and Redux (from modern App versions)
  const reduxState = useSelector((state: RootState) => state.kernel);
  const uiState = useSelector((state: RootState) => state.ui);
  
  const messages = propsMessages || reduxState.messages;
  const phases = propsPhases || reduxState.phases;
  const mappings = reduxState.mappings;
  const activeMappingId = reduxState.activeMappingId;
  const isExecuting = uiState.isExecuting;
  
  const [userInput, setUserInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [eventRate, setEventRate] = useState(0);
  
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const activeMapping = propsActiveMapping || mappings.find(m => m.id === activeMappingId);

  // Motion Kernel Integration
  const signals: EventSignal[] = useMemo(() => [
    { id: 'input_burst', type: 'input', rate: eventRate },
    { id: 'idle_drift', type: 'idle', rate: 1 }
  ], [eventRate]);

  const kernel = useMotionKernel(signals, 256);

  // GPU Renderer & CSS Sync Loop
  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return;

    const glState = initMotionGL(gl);
    const glBuffers = setupBuffersGL(gl, kernel.particles, signals.length);

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      drawMotionGL(gl, glState, glBuffers, signals, kernel);
      
      // Synchronize Motion Law state with CSS Variables
      if (rootRef.current) {
        const f = kernel.frameRef.current;
        const style = rootRef.current.style;
        const driftX = (f.drift01 - 0.5) * 2 * 12; // 12px drift budget
        const driftY = (f.drift01 - 0.5) * 1.2 * 8;
        
        style.setProperty('--drift-x', `${snap025(driftX)}px`);
        style.setProperty('--drift-y', `${snap025(driftY)}px`);
        style.setProperty('--pulse-opacity', (0.05 + f.pulse01 * 0.15).toString());
        style.setProperty('--signal-energy', (f.pulse01).toString());
      }
      
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [kernel, signals]);

  // Event Rate Decay
  useEffect(() => {
    const interval = setInterval(() => {
      setEventRate(prev => Math.max(0, prev - 0.2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const commitMessage = (text: string, role: 'agent' | 'user' | 'system' = 'agent', metadata?: any) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      text,
      timestamp: new Date().toISOString(),
      metadata
    };

    if (propsSetMessages) {
      propsSetMessages([...messages, newMessage]);
    } else {
      dispatch(addMessage(newMessage));
    }
    
    // Trigger Motion Burst based on signal importance
    setEventRate(prev => Math.min(10, prev + (role === 'user' ? 4.5 : 2.0)));
    kernel.fire('input_burst');
    
    const ledgerEntry = {
      id: crypto.randomUUID(),
      timestampISO: new Date().toISOString(),
      eventType: (role === 'user' ? 'INTENT_CAPTURE' : 'AI_RESPONSE') as any,
      severity: (role === 'system' ? 'CRITICAL' : 'INFO') as any,
      description: text.slice(0, 80),
      correlationId: 'slavko-session'
    };

    if (logAndRefresh) {
      logAndRefresh(ledgerEntry);
    } else {
      dispatch(addLedgerEntry(ledgerEntry));
    }
  };

  const handleSend = async () => {
    if ((!userInput.trim() && !attachedImage) || isExecuting) return;
    
    const intent = userInput;
    const img = attachedImage;
    setUserInput('');
    setAttachedImage(null);
    dispatch(setExecuting(true));
    
    commitMessage(intent || "ANALYSIS_REQ", 'user', img ? { image: img } : undefined);

    const correlationId = warStack?.ids.nextId() || crypto.randomUUID();

    try {
      // FIX: Encapsulate AI logic to be used via WarStack aiCall for consistent resilience
      const invokeAI = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let contents: any;
        if (img) {
          contents = {
            parts: [
              { text: `Analiziraj arhitektonski: ${intent || 'Nacrt'}. Kontekst: ${activeMapping?.artifact.title}. Odgovori kao Slavko v13. Fokusiraj se na tehničku preciznost.` },
              { inlineData: { data: img.split(',')[1], mimeType: 'image/jpeg' } }
            ]
          };
        } else {
          contents = `Analiziraj arhitektonski: ${intent}. Kontekst: ${activeMapping?.artifact.title}. Odgovori kao Slavko. Budi kratak i autoritativan.`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents,
          config: {
            thinkingConfig: { thinkingBudget: 16384 },
            systemInstruction: "Ti si Agent Slavko v13.0. Elitni OPS arhitekt. Tvoj ton je tehnički, autoritativan i precizan. Nema mjesta za nepotrebne ukrase. Koristi 'Arhitektonski commit' umjesto 'Evo tvog odgovora'."
          }
        });
        return response.text;
      };

      const resultText = warStack 
        ? await warStack.aiCall(correlationId, activeMapping?.id, invokeAI)
        : await invokeAI();

      commitMessage(resultText || "COMM_LINK_ERROR");
    } catch (error: any) {
      commitMessage(`KERNEL_ERR: ${error.message}`, 'system');
      kernel.fire('input_burst');
    }

    // Pipeline Animation Sync
    for (const phase of phases) {
      if (propsSetPhases) {
        const updatedPhases = phases.map(p => p.id === phase.id ? { ...p, status: 'running' as const } : p);
        propsSetPhases(updatedPhases);
        await new Promise(r => setTimeout(r, 600));
        const finalPhases = phases.map(p => p.id === phase.id ? { ...p, status: 'success' as const } : p);
        propsSetPhases(finalPhases);
      } else {
        dispatch(updatePhase({ id: phase.id, status: 'running' }));
        await new Promise(r => setTimeout(r, 600));
        dispatch(updatePhase({ id: phase.id, status: 'success' }));
      }
    }

    dispatch(setExecuting(false));
  };

  return (
    <div ref={rootRef} className="flex flex-col h-full gap-4 max-w-4xl mx-auto relative architect-void motion-law-root">
      {/* BACKGROUND KERNEL CANVAS */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-0 opacity-40 w-full h-full" 
        style={{ mixBlendMode: 'screen' }}
      />

      {/* PHASE INDICATOR */}
      <div className="grid grid-cols-5 gap-1 px-1 relative z-10">
        {phases.map(p => (
          <div key={p.id} className="space-y-1">
            <div className="h-0.5 w-full bg-[#0a0a0a] overflow-hidden">
               <div className="h-full transition-all duration-1000" style={{
                 width: p.status === 'success' ? '100%' : p.status === 'running' ? '50%' : '0%',
                 backgroundColor: p.status === 'running' ? 'var(--signal)' : p.status === 'success' ? 'var(--signal)' : '#111',
                 opacity: p.status === 'running' ? 0.3 + (kernel.frameRef.current.pulse01 * 0.7) : 1
               }} />
            </div>
            <div className="text-[7px] font-bold uppercase tracking-[0.25em] text-[#333] transition-colors duration-500" style={{
               color: p.status === 'running' ? 'var(--signal)' : undefined
            }}>{p.name}</div>
          </div>
        ))}
      </div>

      {/* CORE TERMINAL */}
      <div className="flex-1 architect-card rounded-2xl overflow-y-auto p-6 md:p-10 space-y-12 border-[#111] shadow-2xl relative z-10 architect-void scroll-smooth">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-entry`}>
            <div className="max-w-[85%] p-6 rounded-sm text-[13px] leading-relaxed border transition-all duration-700" style={{
              backgroundColor: m.role === 'user' ? `var(--bone)` : `rgba(0,0,0,0.9)`,
              borderColor: m.role === 'user' ? `var(--signal)` : `rgba(0, 255, 65, ${0.05 + kernel.frameRef.current.pulse01 * 0.1})`,
              color: m.role === 'user' ? `#000000` : `var(--bone)`,
              boxShadow: m.role === 'agent' ? `0 0 40px rgba(0, 255, 65, calc(var(--pulse-opacity) * 0.2))` : 'none',
              backdropFilter: 'blur(12px)'
            }}>
              {m.role === 'agent' && (
                <div className="text-[8px] font-black uppercase mb-4 tracking-[0.6em] text-[var(--signal)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
                  Architect_Slavko // OPS_INT
                </div>
              )}
              {m.metadata?.image && (
                <div className="mb-5 overflow-hidden border border-[#222]">
                  <img src={m.metadata.image} className="w-full grayscale hover:grayscale-0 transition-all duration-1000" />
                </div>
              )}
              <div className="whitespace-pre-wrap font-medium tracking-tight">{m.text}</div>
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="flex justify-start animate-entry">
            <div className="bg-[#050505] border border-dashed border-[#222] px-6 py-4 rounded-sm">
               <div className="flex gap-1.5 items-center">
                  <div className="w-1 h-1 bg-[var(--signal)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-[var(--signal)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-[var(--signal)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest ml-4">Processing_Architectural_Commit...</span>
               </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* CONSOLE UI */}
      <div className="border border-[#111] rounded-lg flex flex-col bg-black p-0.5 shadow-2xl relative z-10">
        <div className="flex items-center px-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-4 text-[#333] hover:text-[var(--signal)] transition-colors"
            title="Attach Architectural Blueprint"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onloadend = () => setAttachedImage(r.result as string);
                r.readAsDataURL(f);
              }
            }} />
          </button>
          
          <input 
            disabled={isExecuting} 
            className="flex-1 bg-transparent border-0 focus:ring-0 py-7 px-4 text-sm focus:outline-none text-white font-mono placeholder-[#1a1a1a]"
            placeholder={isExecuting ? "EXECUTING_KERNEL_CMD..." : "UNESI_ARHITEKTONSKI_NALOG"} 
            value={userInput} 
            onChange={e => setUserInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
          />
          
          <button 
            disabled={isExecuting || (!userInput.trim() && !attachedImage)} 
            onClick={handleSend}
            className="px-12 py-6 text-black font-black text-[10px] uppercase tracking-[0.5em] bg-[var(--signal)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-5"
          >
            Commit
          </button>
        </div>
        {attachedImage && (
          <div className="px-4 pb-4 animate-entry">
            <div className="relative inline-block border border-[var(--signal)] group">
              <img src={attachedImage} className="w-16 h-16 object-cover opacity-80" />
              <button 
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 bg-black text-[var(--signal)] border border-[var(--signal)] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-[var(--signal)] hover:text-black transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentSlavkoChat;
