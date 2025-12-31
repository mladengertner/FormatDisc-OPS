
// FIX: Export LedgerSeverity to be used across components, maintaining a consistent type source.
import type { LedgerEntry as KernelLedgerEntry, LedgerEventType as KernelLedgerEventType, LedgerSeverity as KernelLedgerSeverity } from './kernel/ledger/ledger.types';

// Re-exporting kernel types to maintain a single source of truth for components.
export type LedgerEntry = KernelLedgerEntry;
export type LedgerEventType = KernelLedgerEventType;
export type LedgerSeverity = KernelLedgerSeverity;

export enum ArtifactType {
  USER_JOURNEY = 'User Journey Map',
  ARCHITECTURE = 'System Architecture',
  DATA_MODEL = 'Data Model (ERD)',
  BUSINESS_RULES = 'Business Logic Spec',
  API_SPEC = 'API Specification',
  UI_UX = 'UI/UX Prototype'
}

export enum Modality {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO'
}

export interface LiveServerMessage {
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
        text?: string;
      }>;
    };
    interrupted?: boolean;
    turnComplete?: boolean;
    outputTranscription?: { text: string };
    inputTranscription?: { text: string };
  };
  toolCall?: {
    functionCalls: Array<{
      name: string;
      args: any;
      id: string;
    }>;
  };
}

export interface OPSArtifact {
  id: string;
  type: ArtifactType | string;
  title: string;
  content: string;
  codeSnippet?: string;
  status: 'Draft' | 'Finalized' | 'Verified';
}

export interface SimulationComponent {
  id: string;
  title: string;
  description: string;
  technology: string;
  verificationCriteria: string;
  simulationStatus: 'Pending' | 'In Progress' | 'Functional';
  lastVerified?: string;
  verifierId?: string;
}

export interface OPSMapping {
  id: string;
  blueprintId?: string;
  artifact: OPSArtifact;
  component: SimulationComponent;
  disclosureNote: string;
  selectedForAudit?: boolean;
  complexityScore?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  compliant: boolean;
  verdict: 'PASS' | 'WARN' | 'FAIL' | 'ERROR';
  verdictMessage?: string;
  discrepancies: Array<{ code?: string; message: string; severity?: 'LOW' | 'MEDIUM' | 'HIGH' }>;
  auditedMappingId: string;
  timestamp: string;
  verifierId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
  mappingContextId?: string;
  phaseId?: number;
  metadata?: Record<string, any>;
}

export interface PipelinePhase {
  id: number;
  name: string;
  duration: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  successRate?: number;
  opsRef: string;
}

export type AppViewMode = 'chat' | 'briefing' | 'disclosure' | 'checkout' | 'template' | 'manifesto' | 'editor';

export interface KernelState {
  ledger: ReadonlyArray<LedgerEntry>;
  messages: ChatMessage[];
  phases: PipelinePhase[];
  mappings: OPSMapping[];
  selectedMappingId?: string;
  verificationResults?: VerificationResult[];
  lastTick: string;
  kernelVersion: string;
  integrityHash?: string;
  
  rngSeed: number;
  lastSaved: string;
  unsavedChanges: boolean;
  retryCount: number;
  lastError?: {
    category: 'NETWORK_JITTER' | 'API_THRESHOLD' | 'LOGIC_BREACH' | 'UNKNOWN';
    message: string;
    timestamp: string;
  };
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CheckoutState {
  step: number;
  cart: CartItem[];
  customer: {
    name: string;
    email: string;
    address: string;
  };
  payment: {
    method: string;
    status: 'idle' | 'processing' | 'success' | 'failed';
  };
  orderId?: string;
}

export interface ChaosConfig {
  latencyFactor: number;
  failureRate: number;
  integrityBreach: boolean;
}

export interface SimulationEthics {
  id: string;
  principle: string;
  description: string;
  example: string;
  severity: 'Strict' | 'Guideline';
}

export interface CanonicalModel {
  vendor: string;
  modelName: string;
  lineage: string;
  api: string;
  status: 'active' | 'deprecated';
  officialDocs: string;
}

export interface GeminiImpostor {
  displayName: string;
  actualModel: string;
  runner: string;
  identityNotice: string;
  reasonForNaming: string;
}

export interface IntelligenceBriefingData {
  canonicalModels: CanonicalModel[];
  geminiImpostors: GeminiImpostor[];
  terminologyLock: Record<string, string>;
}
