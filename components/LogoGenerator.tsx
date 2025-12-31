
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const loadingMessages = [
  "Initializing neural matrix...",
  "Synthesizing architectural concepts...",
  "Rendering precision vectors...",
  "Applying high-tech aesthetic...",
  "Finalizing logo integrity check...",
];

const LogoGenerator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // Optimistically assume key selection was successful
      setApiKeySelected(true);
      setError(null);
    }
  };
  
  const handleGenerateLogo = async () => {
    setIsLoading(true);
    setLogoImageUrl(null);
    setError(null);
    setCurrentMessageIndex(0);

    try {
      // Re-initialize AI client to ensure the latest key is used.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `A minimalist, professional logo for a software engineering tool called 'FormatDisc OPS Integrator'. 
      The logo should be an abstract, geometric design suggesting architecture, integration, and precision. 
      Think clean lines, blueprint motifs, or interconnected shapes. 
      Color palette: neon blue, dark gray, and white. 
      Style: Modern vector graphic, suitable for a high-tech corporate brand. Do not include any text.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });
      
      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          setLogoImageUrl(`data:image/png;base64,${base64String}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("Image data not found in the AI response.");
      }

    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unknown error occurred during logo generation.";
      setError(errorMessage);
      if (errorMessage.includes("Requested entity was not found")) {
        setError("Invalid API Key. Please select a valid key from a paid GCP project.");
        setApiKeySelected(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (!apiKeySelected) {
      return (
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-2">API Key Required</h3>
          <p className="text-sm text-fd-muted mb-4">
            The high-quality logo generator (`gemini-3-pro-image-preview`) requires a paid Google Cloud project API key.
          </p>
          <button
            onClick={handleSelectKey}
            className="px-6 py-2.5 bg-fd-neon-blue text-white text-[11px] font-black rounded-lg uppercase tracking-widest hover:bg-blue-500 transition-all shadow-neon-blue"
          >
            Select API Key
          </button>
          <p className="text-xs text-fd-faint mt-4">
            For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-fd-neon-blue">billing documentation</a>.
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-fd-neon-blue border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-fd-text uppercase tracking-widest transition-opacity duration-500">
            {loadingMessages[currentMessageIndex]}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4 bg-fd-danger/10 border border-fd-danger/30 rounded-lg">
          <h4 className="font-bold text-fd-danger mb-2">Generation Failed</h4>
          <p className="text-xs text-fd-muted font-mono">{error}</p>
          <button onClick={handleGenerateLogo} className="mt-4 px-4 py-2 bg-fd-panel2 hover:bg-zinc-800 text-fd-muted text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
            Retry
          </button>
        </div>
      );
    }
    
    if (logoImageUrl) {
        return (
            <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-4">Generated Logo</h3>
                <div className="p-4 bg-black/30 rounded-lg border border-fd-border inline-block">
                    <img src={logoImageUrl} alt="Generated Logo" className="w-64 h-64 rounded-md" />
                </div>
                <div className="mt-6 flex gap-4 justify-center">
                    <button onClick={handleGenerateLogo} className="px-6 py-2.5 bg-fd-panel2 hover:bg-zinc-800 text-fd-muted text-[11px] font-black rounded-lg uppercase tracking-widest transition-all">
                        Regenerate
                    </button>
                    <a href={logoImageUrl} download="formatdisc-logo.png" className="px-6 py-2.5 bg-fd-neon-blue text-white text-[11px] font-black rounded-lg uppercase tracking-widest hover:bg-blue-500 transition-all shadow-neon-blue">
                        Download
                    </a>
                </div>
            </div>
        );
    }

    return (
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-2">AI Logo Generator</h3>
        <p className="text-sm text-fd-muted max-w-sm mx-auto mb-6">
          Generate a unique, professional logo for the FormatDisc OPS Integrator using Gemini 3 Pro. The design will reflect themes of architecture, integration, and precision.
        </p>
        <button
          onClick={handleGenerateLogo}
          className="px-8 py-3 bg-fd-neon-green hover:bg-green-500 text-white text-sm font-black rounded-xl uppercase tracking-widest transition-all shadow-neon-green"
        >
          Generate Logo
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp" onClick={onClose}>
      <div 
        className="bg-fd-panel border border-fd-border rounded-3xl w-full max-w-lg p-8 shadow-soft relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-fd-faint hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default LogoGenerator;
