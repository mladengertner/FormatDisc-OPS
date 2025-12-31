import React, { createContext, useContext, useReducer, useEffect } from 'react';

type ViewMode = 'chat' | 'table' | 'components' | 'designer' | 'ethics';

interface UIState {
  viewMode: ViewMode;
  selectedMappingId?: string;
  unsavedChanges: boolean;
  isExecuting: boolean;
  agentTyping: boolean;
  lastSaved?: string;
  ledgerChainValid: boolean;
}

type UIAction =
  | { type: 'SWITCH_VIEW'; payload: ViewMode }
  | { type: 'SELECT_MAPPING'; payload: string }
  | { type: 'SET_UNSAVED'; payload: boolean }
  | { type: 'SET_EXECUTING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'UPDATE_LAST_SAVED'; payload: string }
  | { type: 'SET_LEDGER_CHAIN_VALID'; payload: boolean };

const initialState: UIState = {
  viewMode: 'chat',
  unsavedChanges: false,
  isExecuting: false,
  agentTyping: false,
  ledgerChainValid: true,
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SWITCH_VIEW':
      return { ...state, viewMode: action.payload };
    case 'SELECT_MAPPING':
      return { ...state, selectedMappingId: action.payload };
    case 'SET_UNSAVED':
      return { ...state, unsavedChanges: action.payload };
    case 'SET_EXECUTING':
      return { ...state, isExecuting: action.payload };
    case 'SET_TYPING':
      return { ...state, agentTyping: action.payload };
    case 'UPDATE_LAST_SAVED':
      return { ...state, lastSaved: action.payload };
    case 'SET_LEDGER_CHAIN_VALID':
      return { ...state, ledgerChainValid: action.payload };
    default:
      return state;
  }
};

const UIStateContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
} | null>(null);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Auto-save effect
  useEffect(() => {
    if (state.unsavedChanges) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'UPDATE_LAST_SAVED', payload: new Date().toISOString() });
        dispatch({ type: 'SET_UNSAVED', payload: false });
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [state.unsavedChanges]);

  return (
    <UIStateContext.Provider value={{ state, dispatch }}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
};