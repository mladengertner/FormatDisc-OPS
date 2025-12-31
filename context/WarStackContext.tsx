import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { SlavkoWarStack } from '../kernel/warstack/SlavkoWarStack';
import { KernelState, KernelEvent, LedgerEntry } from '../kernel/warstack/contracts';
import { isKernelError, RecoverableKernelError } from '../kernel/warstack/errors';
import { WarStackAdapter } from '../kernel/warstack/warstack';

export type ExtendedKernelState = KernelState & {
  status: 'IDLE' | 'LOADING' | 'ERROR' | 'RECOVERY';
  errorMessage?: string;
};

interface WarStackContextType {
  state: ExtendedKernelState;
  dispatch: (event: KernelEvent) => Promise<void>;
  ledgerEntries: ReadonlyArray<LedgerEntry>;
  // Legacy support for other components until full migration
  generateReport: () => Promise<any>;
}

const WarStackContext = createContext<WarStackContextType | undefined>(undefined);

type Action =
  | { type: 'START_LOADING' }
  | { type: 'PROCESS_EVENT'; event: KernelEvent }
  | { type: 'HANDLE_ERROR'; error: Error }
  | { type: 'START_RECOVERY' }
  | { type: 'RESET' }
  | { type: 'SYNC_STATE' }; // New action to sync with external changes

const initialState: ExtendedKernelState = {
  mode: 'IDLE',
  seed: 42,
  cognitiveLoad: 0,
  status: 'IDLE',
};

const warStackReducer = (state: ExtendedKernelState, action: Action, kernel: SlavkoWarStack): ExtendedKernelState => {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, status: 'LOADING' };
    case 'PROCESS_EVENT':
      kernel.processEvent(action.event);
      return { ...kernel.getState(), status: 'IDLE' }; // Success -> reset to IDLE
    case 'HANDLE_ERROR':
      console.warn('Meta-event: Error logged', action.error); // Audit meta
      return { ...state, status: 'ERROR', errorMessage: action.error.message };
    case 'START_RECOVERY':
      kernel.reset(state.seed); // Auto-recovery with same seed
      console.warn('Meta-event: Recovery initiated'); // Audit meta
      return { ...kernel.getState(), status: 'RECOVERY' };
    case 'RESET':
      kernel.reset();
      return { ...initialState, ...kernel.getState() };
    case 'SYNC_STATE':
       return { ...state, ...kernel.getState() };
    default:
      return state;
  }
};

export const WarStackProvider: React.FC<{ value: WarStackAdapter; children: ReactNode }> = ({ value: adapter, children }) => {
  // Use the 'elite' kernel from the adapter
  const kernel = adapter.elite;
  
  const [state, reducerDispatch] = useReducer(
    (prevState: ExtendedKernelState, action: Action) => warStackReducer(prevState, action, kernel),
    { ...initialState, ...kernel.getState() }
  );

  // Sync state on mount and intervals to catch up with any adapter-based changes
  useEffect(() => {
    const interval = setInterval(() => {
       reducerDispatch({ type: 'SYNC_STATE' });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dispatch = async (event: KernelEvent): Promise<void> => {
    reducerDispatch({ type: 'START_LOADING' });
    await new Promise(resolve => setTimeout(resolve, 300)); // Pause for "decision"
    try {
      reducerDispatch({ type: 'PROCESS_EVENT', event });
    } catch (error) {
      reducerDispatch({ type: 'HANDLE_ERROR', error: error as Error });
      if (isKernelError(error) && error instanceof RecoverableKernelError) {
        reducerDispatch({ type: 'START_RECOVERY' });
        await new Promise(resolve => setTimeout(resolve, 600)); // Pause for recovery
      }
    }
  };

  useEffect(() => {
    if (state.status === 'RECOVERY') {
      const timer = setTimeout(() => reducerDispatch({ type: 'RESET' }), 900); // Auto-reset after pause
      return () => clearTimeout(timer);
    }
  }, [state.status]);

  const value = { 
    state, 
    dispatch, 
    ledgerEntries: kernel.getLedgerEntries(),
    generateReport: () => adapter.generateEliteReport()
  };

  return <WarStackContext.Provider value={value}>{children}</WarStackContext.Provider>;
};

export const useWarStack = () => {
  const context = useContext(WarStackContext);
  if (!context) throw new Error('useWarStack must be inside WarStackProvider');
  return context;
};
