import React, { useState, useRef, useEffect } from 'react';
import { useWarStack } from '../context/WarStackContext';
import { MotionWrapper } from './MotionWrapper';

export const ChatPanel: React.FC = () => {
  const { state, dispatch } = useWarStack();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'system', content: `SlavkoKernel v13.0 initialized. Mode: ${state.mode}` }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || state.status === 'LOADING') return;
    
    const cmd = input;
    setMessages((prev) => [...prev, { role: 'user', content: cmd }]);
    setInput('');

    // Dispatch COMMAND event to kernel
    await dispatch({ 
      type: 'COMMAND', 
      payload: { name: 'chat', args: { message: cmd } } 
    });

    setMessages((prev) => [...prev, { 
      role: 'agent', 
      content: `Kernel: Processed "${cmd}" in ${state.mode} mode. Load: ${state.cognitiveLoad}%` 
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <MotionWrapper state={state.status === 'LOADING' ? 'changing' : 'entering'} className="bg-layer-1 border-subtle rounded-lg h-full flex flex-col overflow-hidden interact-hover shadow-soft transition-all duration-500">
      {/* Header */}
      <div className="p-5 border-b border-subtle flex justify-between items-center bg-layer-1">
        <h2 className="text-sm font-bold tracking-tight">Command Log</h2>
        <div className="flex gap-2">
           <span className={`text-[10px] font-mono px-2 py-1 rounded border border-subtle ${state.status === 'ERROR' ? 'text-fd-danger bg-fd-danger/10' : 'text-fd-muted bg-layer-2'}`}>
             STATUS: {state.status}
           </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} data-state="entering" className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed border ${
              msg.role === 'user' ? 'bg-bone text-ink border-bone' : 
              msg.role === 'system' ? 'bg-layer-2 text-fd-muted border-subtle font-mono text-xs' :
              'bg-layer-2 text-fd-text border-subtle'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {state.errorMessage && (
           <div data-state="entering" className="flex justify-center">
              <div className="bg-fd-danger/10 text-fd-danger border border-fd-danger/30 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">
                Error: {state.errorMessage}
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-subtle bg-layer-1">
        <div className="flex gap-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Input command..."
            disabled={state.status === 'LOADING'}
            className="flex-1 bg-layer-2 border border-subtle rounded-md px-4 py-3 text-sm focus:border-[var(--signal)] focus:bg-[var(--ink)] transition-colors placeholder:text-[var(--fd-faint)] outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || state.status === 'LOADING'}
            data-state={input ? 'active' : ''}
            className="px-6 bg-[var(--signal)] text-white font-bold text-xs uppercase tracking-widest rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {state.status === 'LOADING' ? '...' : 'Exec'}
          </button>
        </div>
      </div>
    </MotionWrapper>
  );
};
