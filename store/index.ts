
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, PipelinePhase, OPSMapping, LedgerEntry, VerificationResult, CheckoutState, CartItem } from '../types';
import { INITIAL_MAPPINGS } from '../constants';

// --- KERNEL SLICE ---
interface KernelSliceState {
  messages: ChatMessage[];
  phases: PipelinePhase[];
  mappings: OPSMapping[];
  activeMappingId: string;
  verificationResults: VerificationResult[];
}

const initialPhases: PipelinePhase[] = [
  { id: 1, name: 'Scope Lock', duration: '2h', status: 'pending', opsRef: 'art-001' },
  { id: 2, name: 'Blueprint Sync', duration: '8h', status: 'pending', opsRef: 'art-005' },
  { id: 3, name: 'Sandbox SIM', duration: '8h', status: 'pending', opsRef: 'art-006' },
  { id: 4, name: 'Compliance Gate', duration: '6h', status: 'pending', opsRef: 'art-004' },
  { id: 5, name: 'Production Commit', duration: '24h', status: 'pending', opsRef: 'art-001' }
];

const kernelSlice = createSlice({
  name: 'kernel',
  initialState: {
    messages: [
      { id: '1', role: 'agent', text: 'SlavkoKernel v13.0 (Elite) operativan. Čekam arhitektonski nalog.', timestamp: new Date().toISOString() }
    ],
    phases: initialPhases,
    mappings: INITIAL_MAPPINGS,
    activeMappingId: INITIAL_MAPPINGS[0].id,
    verificationResults: [],
  } as KernelSliceState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    updatePhase: (state, action: PayloadAction<{id: number, status: PipelinePhase['status']}>) => {
      const phase = state.phases.find(p => p.id === action.payload.id);
      if (phase) phase.status = action.payload.status;
    },
    setPhases: (state, action: PayloadAction<PipelinePhase[]>) => {
      state.phases = action.payload;
    },
    setActiveMappingId: (state, action: PayloadAction<string>) => {
      state.activeMappingId = action.payload;
    },
    setMappings: (state, action: PayloadAction<OPSMapping[]>) => {
      state.mappings = action.payload;
    },
    addVerificationResult: (state, action: PayloadAction<VerificationResult>) => {
      state.verificationResults.unshift(action.payload);
    },
    setVerificationResults: (state, action: PayloadAction<VerificationResult[]>) => {
      state.verificationResults = action.payload;
    }
  }
});

// --- UI SLICE ---
interface UISliceState {
  viewMode: 'chat' | 'briefing' | 'disclosure' | 'checkout' | 'template' | 'manifesto';
  isExecuting: boolean;
  unsavedChanges: boolean;
  resurrected: boolean;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    viewMode: 'chat',
    isExecuting: false,
    unsavedChanges: false,
    resurrected: false,
  } as UISliceState,
  reducers: {
    setViewMode: (state, action: PayloadAction<UISliceState['viewMode']>) => {
      state.viewMode = action.payload;
    },
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },
    setUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.unsavedChanges = action.payload;
    },
    setResurrected: (state, action: PayloadAction<boolean>) => {
      state.resurrected = action.payload;
    }
  }
});

// --- CHECKOUT SLICE ---
const INITIAL_CART: CartItem[] = [
  { id: 'p-101', name: 'Standard Subscription', price: 89.99, quantity: 1 },
  { id: 'p-102', name: 'Add-on: Advanced Metrics', price: 15.00, quantity: 1 }
];

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    step: 1,
    cart: INITIAL_CART,
    customer: { name: '', email: '', address: '' },
    payment: { method: 'Credit Card', status: 'idle' },
    orderId: undefined
  } as CheckoutState,
  reducers: {
    setCheckoutStep: (state, action: PayloadAction<number>) => {
      state.step = action.payload;
    },
    updateCustomer: (state, action: PayloadAction<Partial<CheckoutState['customer']>>) => {
      state.customer = { ...state.customer, ...action.payload };
    },
    updatePaymentStatus: (state, action: PayloadAction<CheckoutState['payment']['status']>) => {
      state.payment.status = action.payload;
    },
    setOrderId: (state, action: PayloadAction<string>) => {
      state.orderId = action.payload;
    },
    resetCheckout: (state) => {
      state.step = 1;
      state.payment.status = 'idle';
      state.orderId = undefined;
    }
  }
});

// --- LEDGER SLICE ---
interface LedgerSliceState {
  entries: LedgerEntry[];
}

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState: { entries: [] } as LedgerSliceState,
  reducers: {
    addLedgerEntry: (state, action: PayloadAction<LedgerEntry>) => {
      state.entries.push(action.payload);
    },
    setLedgerEntries: (state, action: PayloadAction<LedgerEntry[]>) => {
      state.entries = action.payload;
    }
  }
});

export const store = configureStore({
  reducer: {
    kernel: kernelSlice.reducer,
    ui: uiSlice.reducer,
    ledger: ledgerSlice.reducer,
    checkout: checkoutSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const { 
  addMessage, setMessages, updatePhase, setPhases, 
  setActiveMappingId, setMappings, addVerificationResult, setVerificationResults 
} = kernelSlice.actions;

export const { setViewMode, setExecuting, setUnsavedChanges, setResurrected } = uiSlice.actions;

export const { addLedgerEntry, setLedgerEntries } = ledgerSlice.actions;

export const { setCheckoutStep, updateCustomer, updatePaymentStatus, setOrderId, resetCheckout } = checkoutSlice.actions;
