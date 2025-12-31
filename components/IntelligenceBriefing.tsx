
import React from 'react';
import { IntelligenceBriefingData } from '../types';

const BRIEFING_DATA: { intelligenceBriefing: IntelligenceBriefingData } = {
  "intelligenceBriefing": {
    "canonicalModels": [
      { "vendor": "Google DeepMind", "modelName": "Gemini 1.0", "lineage": "Gemini", "api": "Gemini API", "status": "deprecated", "officialDocs": "https://deepmind.google/technologies/gemini/v1-0/" },
      { "vendor": "Google DeepMind", "modelName": "Gemini 1.5", "lineage": "Gemini", "api": "Gemini API", "status": "deprecated", "officialDocs": "https://deepmind.google/technologies/gemini/" },
      { "vendor": "Google DeepMind", "modelName": "Gemini 1.5 Pro", "lineage": "Gemini", "api": "Gemini API", "status": "active", "officialDocs": "https://deepmind.google/technologies/gemini/" },
      { "vendor": "Google DeepMind", "modelName": "Gemini 1.5 Flash", "lineage": "Gemini", "api": "Gemini API", "status": "active", "officialDocs": "https://deepmind.google/technologies/gemini/" }
    ],
    "geminiImpostors": [
      { "displayName": "Gemini 3", "actualModel": "LLaMA / community fine-tune", "runner": "Ollama", "identityNotice": "NOT Google Gemini", "reasonForNaming": "marketing / API compatibility" },
      { "displayName": "Gemini 3 Flash", "actualModel": "Mixtral / community build", "runner": "Ollama", "identityNotice": "NOT Google Gemini", "reasonForNaming": "marketing / perception" },
      { "displayName": "GPT‑OSS120", "actualModel": "Open-weight LLM (LLaMA variant)", "runner": "Ollama", "identityNotice": "NOT Google Gemini", "reasonForNaming": "branding / market signal" }
    ],
    "terminologyLock": {
      "Model": "weights + architecture",
      "API": "service layer exposing model",
      "Runner": "local/cloud execution environment",
      "Orchestrator": "SlavkoKernel",
      "UX": "frontend interface"
    }
  }
};

const Section: React.FC<{ title: string, children: React.ReactNode, variant?: 'default' | 'warning' }> = ({ title, children, variant = 'default' }) => (
  <div className={`border rounded-2xl overflow-hidden shadow-soft ${variant === 'warning' ? 'border-fd-neon-yellow/30 bg-fd-neon-yellow/5' : 'border-fd-border bg-fd-panel'}`}>
    <h3 className={`text-xs font-black uppercase tracking-[0.22em] px-6 py-3 border-b ${variant === 'warning' ? 'text-fd-neon-yellow border-fd-neon-yellow/20 bg-fd-neon-yellow/10' : 'text-fd-muted border-fd-border bg-fd-panel2/30'}`}>
      {title}
    </h3>
    <div className="p-6">{children}</div>
  </div>
);

const IntelligenceBriefing: React.FC = () => {
  const { canonicalModels, geminiImpostors, terminologyLock } = BRIEFING_DATA.intelligenceBriefing;

  return (
    <div className="space-y-8 animate-fadeInUp max-w-6xl mx-auto">
      <header className="text-center">
        <h2 className="text-xl font-bold text-white tracking-tight">Intelligence Briefing: Model Lineage Audit</h2>
        <p className="text-sm text-fd-muted mt-1">Establishing ground truth for AI model identity and terminology.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Section title="Canonical Models">
            <div className="space-y-4">
              {canonicalModels.map(model => (
                <div key={model.modelName} className="bg-fd-panel2 p-4 rounded-lg border border-fd-border hover:border-fd-neon-blue/50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white group-hover:text-fd-neon-blue transition-colors">{model.modelName}</h4>
                      <p className="text-xs text-fd-muted">{model.vendor} / {model.lineage}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${model.status === 'active' ? 'bg-fd-neon-green/10 text-fd-neon-green' : 'bg-zinc-700/50 text-fd-faint'}`}>
                      {model.status}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-fd-border flex justify-between items-center">
                     <span className="text-xs font-mono text-fd-faint">API: {model.api}</span>
                     <a href={model.officialDocs} target="_blank" rel="noopener noreferrer" className="text-fd-neon-blue text-[10px] font-bold uppercase tracking-widest hover:underline">
                        Docs &rarr;
                     </a>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Terminology Lock">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Object.entries(terminologyLock).map(([term, definition]) => (
                <div key={term}>
                  <dt className="text-sm font-bold text-white">{term}</dt>
                  <dd className="text-xs text-fd-muted mt-1 font-mono">{definition}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>

        <Section title="Impostor Models (Community Aliases)" variant="warning">
           <div className="space-y-4">
              {geminiImpostors.map(model => (
                <div 
                  key={model.displayName} 
                  className="bg-fd-panel2 p-4 rounded-lg border border-fd-border group"
                  title={`WARNING: '${model.displayName}' is a community-assigned name. The underlying model is typically ${model.actualModel}. This is NOT an official Google product.`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{model.displayName}</h4>
                      <p className="text-xs text-fd-muted">Runner: {model.runner}</p>
                    </div>
                     <span className="text-xs font-black text-fd-danger uppercase">{model.identityNotice}</span>
                  </div>
                   <div className="mt-3 pt-3 border-t border-fd-border text-xs font-mono text-fd-muted">
                      <strong className="text-fd-faint">Actual Model: </strong>{model.actualModel}
                      <br/>
                      <strong className="text-fd-faint">Reason for Name: </strong>{model.reasonForNaming}
                   </div>
                </div>
              ))}
           </div>
        </Section>
      </div>
    </div>
  );
};

export default IntelligenceBriefing;
