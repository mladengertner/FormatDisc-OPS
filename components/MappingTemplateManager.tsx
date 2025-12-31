
import React, { useState } from 'react';
import { OPSMapping, ArtifactType } from '../types';

const MAPPING_TEMPLATES = [
  { id: 'tpl-auth', name: 'Authentication Microservice', defaults: { type: ArtifactType.API_SPEC, tech: 'Node.js + JWT + Redis', criteria: '95% integration test coverage, token revocation verified', content: 'export async function login(user, pass) { /* JWT neural handshake */ }' } },
  { id: 'tpl-payment', name: 'Payment Processing Gateway', defaults: { type: ArtifactType.BUSINESS_RULES, tech: 'TypeScript + Stripe SDK Mock', criteria: '100% path coverage for charge/refund cycles', content: 'class PaymentProcessor { async charge(amt) { /* PCI-DSS compliant flow */ } }' } },
  { id: 'tpl-data', name: 'Relational Data Model', defaults: { type: ArtifactType.DATA_MODEL, tech: 'Prisma + PostgreSQL (Simulated)', criteria: 'Relational integrity verified via UUID linking', content: 'interface Order { id: UUID; userId: UUID; status: string; }' } }
];

interface Props {
  mappings: OPSMapping[];
  activeId?: string;
  onSelect: (id: string) => void;
  onAddMapping: (mapping: OPSMapping) => void;
  onRemoveMapping: (id: string) => void;
}

const MappingTemplateManager: React.FC<Props> = ({ mappings, activeId, onSelect, onAddMapping, onRemoveMapping }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ artTitle: '', artType: ArtifactType.USER_JOURNEY, artContent: '', simTitle: '', simTech: '', simCriteria: '', complexity: 3, tags: '' });

  const applyTemplate = (tplId: string) => {
    const tpl = MAPPING_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    setFormData({ ...formData, artType: tpl.defaults.type, artContent: tpl.defaults.content, simTech: tpl.defaults.tech, simCriteria: tpl.defaults.criteria, artTitle: tpl.name, simTitle: `${tpl.name} Simulator` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMapping: OPSMapping = {
      id: `map-${crypto.randomUUID()}`,
      artifact: { id: `art-${crypto.randomUUID()}`, type: formData.artType, title: formData.artTitle, content: formData.artContent, status: 'Draft' },
      component: { id: `sim-${crypto.randomUUID()}`, title: formData.simTitle, description: formData.artContent, technology: formData.simTech, verificationCriteria: formData.simCriteria, simulationStatus: 'Pending' },
      complexityScore: formData.complexity,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      disclosureNote: 'Architectural link established via SlavkoKernel Blueprint Engine.'
    };
    onAddMapping(newMapping);
    setShowForm(false);
    setFormData({ artTitle: '', artType: ArtifactType.USER_JOURNEY, artContent: '', simTitle: '', simTech: '', simCriteria: '', complexity: 3, tags: '' });
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fadeInUp">
      <div className="flex items-center justify-between border-b border-fd-border pb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fd-neon-blue animate-pulse"></span>
            Blueprint Repository v12.5
          </h2>
          <p className="text-[10px] text-fd-muted uppercase tracking-[0.3em] mt-1.5 font-semibold">
            Deterministic Architectural Ledger
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`px-5 py-2.5 text-[10px] font-bold rounded-lg flex items-center gap-2 transition-all shadow-soft uppercase tracking-widest ${showForm ? 'bg-fd-panel2 text-fd-muted border border-fd-border' : 'bg-fd-neon-blue hover:bg-blue-500 text-white shadow-neon-blue'}`}>
          {showForm ? 'Close Designer' : '+ New Mapping'}
        </button>
      </div>

      {showForm && (
        <div className="bg-fd-panel border border-fd-neon-blue/30 rounded-2xl p-6 mb-6 animate-in slide-in-from-top-4 duration-500">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <span className="text-[10px] font-black text-fd-muted uppercase tracking-widest self-center mr-2">Templates:</span>
            {MAPPING_TEMPLATES.map(tpl => ( <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} className="whitespace-nowrap px-3 py-1.5 bg-fd-panel2 hover:bg-zinc-800 border border-fd-border rounded-md text-[9px] font-bold text-fd-neon-blue uppercase tracking-widest transition-all"> {tpl.name} </button> ))}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input required placeholder="Artifact Title" className="w-full bg-black border border-fd-border rounded-lg p-3 text-sm focus:border-fd-neon-blue outline-none" value={formData.artTitle} onChange={e => setFormData({...formData, artTitle: e.target.value})} />
              <select className="w-full bg-black border border-fd-border rounded-lg p-3 text-sm focus:border-fd-neon-blue outline-none text-fd-text" value={formData.artType} onChange={e => setFormData({...formData, artType: e.target.value as ArtifactType})}>
                {Object.values(ArtifactType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea required placeholder="Operational Specification Logic..." className="w-full bg-black border border-fd-border rounded-lg p-3 text-sm h-32 focus:border-fd-neon-blue outline-none resize-none font-mono text-xs" value={formData.artContent} onChange={e => setFormData({...formData, artContent: e.target.value})} />
            </div>
            <div className="space-y-4">
              <input required placeholder="Simulation Component Name" className="w-full bg-black border border-fd-border rounded-lg p-3 text-sm focus:border-fd-neon-green outline-none" value={formData.simTitle} onChange={e => setFormData({...formData, simTitle: e.target.value})} />
              <input required placeholder="Technology Stack (e.g. Node.js, React)" className="w-full bg-black border border-fd-border rounded-lg p-3 text-sm focus:border-fd-neon-green outline-none" value={formData.simTech} onChange={e => setFormData({...formData, simTech: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-fd-faint uppercase font-black block mb-1">Complexity (1-5)</label>
                  <input type="number" min="1" max="5" className="w-full bg-black border border-fd-border rounded-lg p-2 text-sm focus:border-fd-neon-green outline-none" value={formData.complexity} onChange={e => setFormData({...formData, complexity: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[9px] text-fd-faint uppercase font-black block mb-1">Tags (Comma Sep)</label>
                  <input placeholder="api, security" className="w-full bg-black border border-fd-border rounded-lg p-2 text-sm focus:border-fd-neon-green outline-none" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                </div>
              </div>
              <textarea required placeholder="Verification Criteria..." className="w-full bg-black border border-fd-border rounded-lg p-3 text-sm h-20 focus:border-fd-neon-green outline-none resize-none font-mono text-xs" value={formData.simCriteria} onChange={e => setFormData({...formData, simCriteria: e.target.value})} />
            </div>
            <div className="lg:col-span-2 pt-4 border-t border-fd-border flex justify-end">
              <button type="submit" className="px-10 py-3 bg-zinc-100 text-black font-black text-[11px] rounded-lg hover:bg-white transition-all uppercase tracking-widest"> Commit to Blueprint Registry </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-fd-panel border border-fd-border rounded-2xl overflow-hidden shadow-soft flex-1 flex flex-col min-h-0 relative">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-fd-panel2 text-fd-muted uppercase tracking-[0.2em] text-[9px] font-black border-b border-fd-border">
                <th className="p-5 w-1/4">OPS Artifact</th>
                <th className="p-5 w-1/4">Simulation Node</th>
                <th className="p-5 w-1/6">Audit Meta</th>
                <th className="p-5">Validation</th>
                <th className="p-5 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fd-border">
              {mappings.map(map => (
                <tr key={map.id} onClick={() => onSelect(map.id)} className={`transition-all cursor-pointer group relative ${activeId === map.id ? 'bg-fd-neon-blue/10' : 'hover:bg-fd-panel2/40'}`}>
                  <td className="p-5 align-top">
                    <div className={`font-black text-sm mb-1 ${activeId === map.id ? 'text-fd-neon-blue' : 'text-fd-text'}`}> {map.artifact.title} </div>
                    <span className="text-[8px] text-fd-faint font-black uppercase tracking-widest bg-fd-panel2 px-2 py-0.5 rounded border border-fd-border"> {map.artifact.type} </span>
                  </td>
                  <td className="p-5 align-top">
                    <div className="font-bold text-fd-neon-green text-[13px]">{map.component.title}</div>
                    <div className="text-[10px] text-fd-muted font-mono mt-1">{map.component.technology}</div>
                  </td>
                  <td className="p-5 align-top">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1 bg-fd-panel2 rounded-full overflow-hidden">
                        <div className={`h-full ${map.complexityScore && map.complexityScore > 3 ? 'bg-fd-danger' : 'bg-fd-neon-blue'}`} style={{ width: `${(map.complexityScore || 0) * 20}%` }} />
                      </div>
                      <span className="text-[10px] text-fd-muted font-mono">C:{map.complexityScore || 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-1"> {map.tags?.map(tag => ( <span key={tag} className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-fd-panel2 border border-fd-border text-fd-faint rounded">{tag}</span> ))} </div>
                  </td>
                  <td className="p-5 text-fd-muted italic text-[11px] align-top"> "{map.component.verificationCriteria}" </td>
                  <td className="p-5 text-center align-middle">
                    <button onClick={(e) => { e.stopPropagation(); onRemoveMapping(map.id); }} className="text-fd-faint/30 hover:text-fd-danger transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MappingTemplateManager;