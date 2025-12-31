
import { SlavkoWarStack, SlavkoWarStackConfig } from './SlavkoWarStack';
import { LedgerEntry as KernelLedgerEntry, KernelEvent, WarStackMode } from './contracts';
import { DeterministicRNG } from '../utils/rng';
import { DeterministicIdFactory } from '../utils/ids';
import { ResilienceWrapper } from '../utils/resilience';
import { StatePersistence } from '../utils/persistence';
import { LedgerEventType, LedgerSeverity } from '../ledger/ledger.types';
import { WarStackConfig as AppWarStackConfig } from './warstack.config';

// Export for other consumers
export { SlavkoWarStack };
export type EliteWarStackConfig = SlavkoWarStackConfig;

// Backward compatibility types for the UI
export interface LegacyLedgerEntry {
  id: string;
  timestampISO: string;
  eventType: LedgerEventType;
  severity: LedgerSeverity;
  description: string;
  correlationId: string;
  hash?: string;
  metadata?: any;
}

// Internal config interface for Adapter if needed, but we use AppWarStackConfig for init
export interface AdapterConfig {
    version?: string;
    seed?: number;
    mode?: WarStackMode;
}

/**
 * Adapter class to bridge the new SlavkoWarStack v13 to the existing UI requirements.
 */
export class WarStackAdapter {
  public elite: SlavkoWarStack;
  public rng: DeterministicRNG;
  public ids: DeterministicIdFactory;
  public persistence: StatePersistence;
  public config: any;

  constructor(config: AppWarStackConfig | AdapterConfig = {}) {
    // Determine seed
    let seed = 42;
    if ('determinism' in config && config.determinism) {
        seed = config.determinism.seed;
    } else if ('seed' in config && config.seed !== undefined) {
        seed = config.seed;
    }

    this.elite = new SlavkoWarStack({ seed });
    this.rng = new DeterministicRNG(seed);
    this.ids = new DeterministicIdFactory(this.rng, "wk");
    
    // Config stub for compatibility
    this.config = {
      persistence: { storageKey: 'slavko_v13', debounceMs: 1000 },
      resilience: { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 5000, jitterRatio: 0.2 },
      ...config
    };
    
    this.persistence = new StatePersistence({
      debounceMs: 1000,
      autoPersistIntervalMs: 5000,
      onFailureRetry: true
    });

    if ('mode' in config && config.mode) {
      this.elite.processEvent({ type: 'MODE_SWITCH', payload: { mode: config.mode } });
    }
  }

  // Adapter for the ledger store property accessed by App.tsx
  get ledger() {
    return {
      getAll: (): LegacyLedgerEntry[] => {
        return this.elite.getLedgerEntries().map(e => this.mapEntry(e));
      }
    };
  }

  private mapEntry(e: any): LegacyLedgerEntry {
    const event = e.event as KernelEvent;
    let eventType: LedgerEventType = 'CONTEXT_SHIFT';
    let severity: LedgerSeverity = 'INFO';
    let description = '';
    let metadata = {};

    if (event.type === 'LOG') {
      eventType = event.payload.eventType as LedgerEventType;
      severity = event.payload.severity as LedgerSeverity;
      description = event.payload.description;
      metadata = event.payload.metadata;
    } else if (event.type === 'COMMAND') {
      eventType = 'AI_INVOCATION'; // Approximation
      description = `Command: ${event.payload.name}`;
      metadata = event.payload.args;
    } else if (event.type === 'MODE_SWITCH') {
      eventType = 'CONTEXT_SHIFT';
      description = `Mode switched to ${event.payload.mode}`;
    } else if (event.type === 'INIT') {
      eventType = 'BOOT_INIT';
      description = `Kernel Initialized (Seed: ${event.payload.seed})`;
    }

    return {
      id: e.id,
      timestampISO: new Date(e.timestamp).toISOString(),
      eventType,
      severity,
      description,
      correlationId: 'kernel',
      hash: e.hash,
      metadata
    };
  }

  async log(e: {
    eventType: LedgerEventType;
    severity: LedgerSeverity;
    description: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }) {
    this.elite.processEvent({
      type: 'LOG',
      payload: {
        eventType: e.eventType,
        severity: e.severity,
        description: e.description,
        metadata: e.metadata
      }
    });
    
    // Return the mapped entry for UI compatibility
    const entries = this.elite.getLedgerEntries();
    return this.mapEntry(entries[entries.length - 1]);
  }

  async aiCall<T>(
    correlationId: string,
    mappingId: string | undefined,
    invoke: () => Promise<T>
  ): Promise<T> {
    await this.log({
      eventType: "AI_INVOCATION",
      severity: "INFO",
      description: `Invoking AI model [${correlationId.slice(0,6)}]`,
      correlationId
    });

    return ResilienceWrapper.withExponentialBackoff(
      invoke,
      {
        policy: this.config.resilience,
        jitter01: () => this.rng.next(), // Use deterministic RNG for jitter
        onRetry: async (meta, err) => {
          await this.log({
            eventType: "AI_RETRY",
            severity: "WARN",
            description: `Retry attempt ${meta.attempt} | Category: ${err.category}`,
            correlationId,
            metadata: { errorCategory: err.category }
          });
        }
      },
      async (err) => {
        await this.log({
          eventType: "PHASE_BREACH",
          severity: "CRITICAL",
          description: `AI_FAILURE: [${err.category}] ${err.message}`,
          correlationId,
          metadata: { category: err.category }
        });
      }
    );
  }

  // Methods used by WarStackContext
  public getSystemStatus() {
    const state = this.elite.getState();
    // Calculate pseudo-stats since the new kernel is strict
    return {
      kernel: {
        mode: state.mode,
        cognitiveLoad: state.cognitiveLoad,
        commandCount: this.elite.getLedgerEntries().filter(e => e.event.type === 'COMMAND').length,
        rngSeed: state.seed,
        lastCommand: undefined
      },
      score: {
        totalXP: this.elite.getLedgerEntries().length * 10,
        phasesCompleted: 0,
        auditsPassed: 0
      },
      version: '13.0.0-ELITE',
      deploymentTier: 'ELITE'
    };
  }

  public switchMode(mode: any) {
    this.elite.processEvent({ type: 'MODE_SWITCH', payload: { mode } });
  }

  public async executeEliteCommand(command: string, args: any) {
    this.elite.processEvent({ type: 'COMMAND', payload: { name: command, args } });
    
    // Simulate return values based on command for UI compatibility
    if (command === 'analyze') {
      return { result: `SlavkoKernel v13 Analyzed: ${args.query || 'Data'}. Deterministic Output Confirmed.` };
    }
    return { result: 'Command Executed' };
  }

  public async generateEliteReport() {
    const entries = this.elite.getLedgerEntries();
    const report = `
SLAVKO KERNEL v13.0 REPORT
Timestamp: ${new Date().toISOString()}
Total Events: ${entries.length}
Chain Integrity: ${this.elite['ledger'].verify() ? 'VERIFIED' : 'FAILED'}
    `;
    
    this.elite.processEvent({ 
      type: 'LOG', 
      payload: { 
        eventType: 'REPORT_GENERATED', 
        severity: 'SUCCESS', 
        description: 'Elite report generated' 
      } 
    });
    
    // Dispatch event for UI listeners
    if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('warstack-report-generated', { detail: { report } }));
    }
    
    return { report, summary: {} };
  }
}

export type WarStack = WarStackAdapter;

export function initWarStack(config: AppWarStackConfig | AdapterConfig = {}): Promise<WarStack> {
  return Promise.resolve(new WarStackAdapter(config));
}

export function initializeWarStack(config: AppWarStackConfig | AdapterConfig = {}) {
  return new WarStackAdapter(config);
}
