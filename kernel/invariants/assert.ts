
import { isoNow } from '../utils/time';

export type InvariantType = 'MOTION_CLOCK' | 'STATE_TRANSITION' | 'UI_INVOCATION' | 'NETWORK_AUTH';

export interface InvariantBreach {
  type: InvariantType;
  message: string;
  expected: any;
  actual: any;
  timestamp: string;
}

/**
 * KernelInvariants - Self-inspection layer for SlavkoKernel.
 * Monitors operational laws without enforcing them via throws in production.
 */
export class KernelInvariants {
  private static breaches: InvariantBreach[] = [];

  /**
   * Asserts a kernel invariant. If it fails, records a breach.
   */
  static assert(
    condition: boolean, 
    type: InvariantType, 
    message: string, 
    expected: any, 
    actual: any
  ) {
    if (!condition) {
      const breach: InvariantBreach = {
        type,
        message,
        expected,
        actual,
        timestamp: isoNow()
      };
      
      this.breaches.push(breach);

      // Dispatch event for UI listeners (like InvariantPanel)
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('kernel-invariant-breach', { detail: breach }));
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[INVARIANT_BREACH] ${type}: ${message}`, { expected, actual });
      }
    }
  }

  static getBreaches(): ReadonlyArray<InvariantBreach> {
    return this.breaches;
  }
  
  static clearBreaches() {
    this.breaches = [];
  }
}
