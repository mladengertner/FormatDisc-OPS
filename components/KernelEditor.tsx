
import React, { useEffect, useState, useRef } from 'react';
import loader from 'https://esm.sh/@monaco-editor/loader';

const KernelEditor: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Monaco Environment Isolation
    (window as any).MonacoEnvironment = {
      getWorkerUrl: function (_moduleId: any, label: string) {
        // Use ESM.sh provided workers to avoid CORS issues with local files if not hosted correctly
        if (label === 'json') return `https://esm.sh/monaco-editor/esm/vs/language/json/json.worker?worker`;
        if (label === 'css' || label === 'scss' || label === 'less') return `https://esm.sh/monaco-editor/esm/vs/language/css/css.worker?worker`;
        if (label === 'html' || label === 'handlebars' || label === 'razor') return `https://esm.sh/monaco-editor/esm/vs/language/html/html.worker?worker`;
        if (label === 'typescript' || label === 'javascript') return `https://esm.sh/monaco-editor/esm/vs/language/typescript/ts.worker?worker`;
        return `https://esm.sh/monaco-editor/esm/vs/editor/editor.worker?worker`;
      }
    };

    const initMonaco = async () => {
      try {
        const monaco = await loader.init();
        if (containerRef.current) {
          editorRef.current = monaco.editor.create(containerRef.current, {
            value: [
              '// SlavkoKernel v13.0 Runtime Script',
              'function init() {',
              '  console.log("Kernel execution sequence active...");',
              '}',
              '',
              'init();'
            ].join('\n'),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            backgroundColor: '#000000',
          });
          setIsReady(true);
        }
      } catch (err: any) {
        console.error('[KernelEditor] Load error:', err);
        setError(err.message || 'Failed to initialize Monaco');
      }
    };

    initMonaco();

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-black border border-[#111] rounded-sm overflow-hidden animate-entry">
      <div className="px-4 py-2 border-b border-[#111] bg-[#050505] flex justify-between items-center">
        <span className="text-[9px] font-black text-[#444] uppercase tracking-[0.3em]">Runtime_Script_Editor</span>
        <div className="flex gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-[#00ff41]' : 'bg-red-500'} animate-pulse`} />
        </div>
      </div>
      <div className="flex-1 relative min-h-[500px]">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-8 text-center">
            <div className="text-red-500 font-mono text-xs">
              [CRITICAL_FAILURE]: {error}
            </div>
          </div>
        )}
        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-4 h-4 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default KernelEditor;
