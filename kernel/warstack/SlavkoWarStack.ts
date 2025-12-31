
import { KernelState, KernelEvent, WarStackMode, isKernelState, isKernelEvent, isWarStackMode } from './contracts';
import { Ledger } from './ledger/Ledger';
import { RecoverableKernelError, TerminalKernelError, ErrorCode, isRecoverableKernelError } from './errors';
import { recoverFromError } from './resilience/recovery';

export interface SlavkoWarStackConfig {
  version?: string;
  seed?: number;
  deploymentTier?: string;
  deterministicMode?: boolean;
  auditTrailEnabled?: boolean;
  fusionEnabled?: boolean;
  scoringEnabled?: boolean;
  mode?: WarStackMode;
}

/**
 * SlavkoWarStack v13.0: Deterministic orchestration kernel.
 */
export class SlavkoWarStack {
  private state: KernelState;
  private ledger: Ledger;

  constructor(configOrSeed: SlavkoWarStackConfig | number = 42) {
    this.ledger = new Ledger();
    
    let initialSeed = 42;
    let initialMode: WarStackMode = 'IDLE';

    if (typeof configOrSeed === 'number') {
      initialSeed = configOrSeed;
    } else {
      initialSeed = configOrSeed.seed ?? 42;
      if (configOrSeed.mode) {
        initialMode = configOrSeed.mode;
      }
    }

    this.state = { mode: initialMode, seed: initialSeed, cognitiveLoad: 0 };
    this.processEvent({ type: 'INIT', payload: { seed: initialSeed } });
    
    if (initialMode !== 'IDLE') {
       // Recalculate load if starting in a specific mode
       this.state.cognitiveLoad = initialMode === 'WAR' ? 85 : initialMode === 'FUSION' ? 70 : 10;
    }
  }

  /** Process an event (side-effectful; mutates ledger) */
  processEvent(event: KernelEvent): void {
    try {
      if (!isKernelEvent(event)) {
        throw new RecoverableKernelError(ErrorCode.VALIDATION_FAILED, 'Invalid event');
      }

      // State transitions
      switch (event.type) {
        case 'INIT':
          this.state.seed = event.payload.seed;
          break;

        case 'MODE_SWITCH':
          if (!isWarStackMode(event.payload.mode)) {
            throw new RecoverableKernelError(ErrorCode.VALIDATION_FAILED, 'Invalid mode');
          }
          this.state.mode = event.payload.mode;
          // Calculate cognitive load based on mode
          this.state.cognitiveLoad = event.payload.mode === 'WAR' ? 85 : event.payload.mode === 'FUSION' ? 70 : 10;
          break;

        case 'COMMAND':
          // Simulate deterministic work
          const pseudoRandom = this.state.seed * Math.abs(Math.sin(event.payload.name.length));
          this.state.seed = (pseudoRandom % 4294967296) | 0;
          this.state.cognitiveLoad = Math.min(100, this.state.cognitiveLoad + 5);
          break;
        
        case 'LOG':
          // Logging does not change state seed but records info
          break;
      }

      // Append to ledger
      const entry = this.ledger.append(event);
      this.state.lastEventId = entry.id;

      // Verify post-append
      if (!this.ledger.verify()) {
        throw new TerminalKernelError(ErrorCode.LEDGER_INTEGRITY_BREACH, 'Ledger chain broken after append');
      }
    } catch (error) {
      if (isRecoverableKernelError(error)) {
        recoverFromError(this, error);
      } else {
        throw error;
      }
    }
  }

  /** Get current state (pure; snapshot) */
  getState(): KernelState {
    if (!isKernelState(this.state)) {
      throw new TerminalKernelError(ErrorCode.INVALID_STATE, 'Internal state corrupted');
    }
    return { ...this.state };
  }

  /** Get ledger entries (pure) */
  getLedgerEntries() {
    return this.ledger.getEntries();
  }

  /** Reset kernel (side-effectful) */
  reset(newSeed?: number): void {
    this.ledger.reset();
    this.state = { mode: 'IDLE', seed: newSeed ?? 42, cognitiveLoad: 0 };
    this.processEvent({ type: 'INIT', payload: { seed: this.state.seed } });
  }
}
