
import React from 'react';
import { OPSArtifact } from '../types';

interface Props {
  artifact: OPSArtifact;
}

const ArtifactPreview: React.FC<Props> = ({ artifact }) => {
  return (
    <div className="bg-fd-panel border border-fd-border rounded-xl p-4 h-full overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-bold text-fd-neon-blue uppercase tracking-widest">{artifact.type}</span>
          <h3 className="text-base font-semibold text-fd-text mt-1">{artifact.title}</h3>
        </div>
        <span className={`px-2 py-1 text-[10px] font-bold rounded ${
          artifact.status === 'Verified' ? 'bg-fd-neon-green/10 text-fd-neon-green' : 'bg-fd-neon-blue/10 text-fd-neon-blue'
        }`}>
          {artifact.status}
        </span>
      </div>
      
      <p className="text-sm text-fd-muted mb-4 leading-relaxed">
        {artifact.content}
      </p>

      {artifact.codeSnippet && (
        <div className="mt-4">
          <p className="text-[10px] font-mono text-fd-faint mb-2 uppercase tracking-tight">// Spec Fragment</p>
          <pre className="bg-black/40 p-3 rounded-md border border-fd-border text-[13px] font-mono text-fd-neon-blue overflow-x-auto">
            {artifact.codeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ArtifactPreview;