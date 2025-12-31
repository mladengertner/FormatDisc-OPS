import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  event: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  hash: string;
  previousHash: string;
  data?: any;
}

interface LedgerContextType {
  entries: LedgerEntry[];
  addEntry: (event: string, type: LedgerEntry['type'], data?: any) => string;
  clearEntries: () => void;
  verifyChain: () => boolean;
  getRecentEntries: (count: number) => LedgerEntry[];
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  const generateHash = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }, []);

  const addEntry = useCallback((
    event: string,
    type: LedgerEntry['type'],
    data?: any
  ): string => {
    const timestamp = new Date().toISOString();
    const previousHash = entries.length > 0 
      ? entries[entries.length - 1].hash 
      : '0x000';
    
    const entryData = {
      event,
      type,
      timestamp,
      data,
      previousHash,
    };

    const hash = generateHash(JSON.stringify(entryData));
    const id = `ledger-${Date.now()}-${hash.slice(0, 8)}`;

    const newEntry: LedgerEntry = {
      id,
      ...entryData,
      hash,
    };

    setEntries(prev => [...prev, newEntry]);

    // Micro-UX trigger based on event type
    if (type === 'CRITICAL') {
      document.dispatchEvent(new CustomEvent('ledger-critical', { detail: newEntry }));
    } else if (type === 'SUCCESS') {
      document.dispatchEvent(new CustomEvent('ledger-success', { detail: newEntry }));
    }

    return id;
  }, [entries, generateHash]);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  const verifyChain = useCallback((): boolean => {
    if (entries.length <= 1) return true;

    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];

      // Verify hash chain
      if (current.previousHash !== previous.hash) {
        return false;
      }

      // Verify hash matches content
      const expectedHash = generateHash(JSON.stringify({
        event: current.event,
        type: current.type,
        timestamp: current.timestamp,
        data: current.data,
        previousHash: current.previousHash,
      }));

      if (current.hash !== expectedHash) {
        return false;
      }
    }

    return true;
  }, [entries, generateHash]);

  const getRecentEntries = useCallback((count: number): LedgerEntry[] => {
    return entries.slice(-count);
  }, [entries]);

  return (
    <LedgerContext.Provider
      value={{
        entries,
        addEntry,
        clearEntries,
        verifyChain,
        getRecentEntries,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within LedgerProvider');
  }
  return context;
};