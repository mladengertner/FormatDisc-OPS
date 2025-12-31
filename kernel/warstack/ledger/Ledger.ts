
import { LedgerEntry, KernelEvent, createId, isLedgerEntry, isKernelEvent } from '../contracts';
import { TerminalKernelError, ErrorCode } from '../errors';

/**
 * Append-only, hash-chained ledger for auditability.
 */
export class Ledger {
  private entries: LedgerEntry[] = [];
  private genesisHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  /** Append a new entry (side-effectful; mutates ledger) */
  append(event: KernelEvent): LedgerEntry {
    if (!isKernelEvent(event)) {
      throw new TerminalKernelError(ErrorCode.VALIDATION_FAILED, 'Invalid event structure');
    }

    const previousHash = this.entries.length > 0 ? this.entries[this.entries.length - 1].hash : this.genesisHash;
    const timestamp = Date.now();
    const entryData = JSON.stringify({ timestamp, event, previousHash });
    const hash = this.computeHash(entryData);
    const id = createId(`ledger-${timestamp}-${hash.slice(0, 8)}`);

    const entry: LedgerEntry = { id, timestamp, event, previousHash, hash };
    this.entries.push(entry);
    return entry;
  }

  /** Verify entire chain integrity */
  verify(): boolean {
    for (let i = 1; i < this.entries.length; i++) {
      const current = this.entries[i];
      const previous = this.entries[i - 1];

      // Check link
      if (current.previousHash !== previous.hash) return false;

      // Recompute hash
      const expectedData = JSON.stringify({
        timestamp: current.timestamp,
        event: current.event,
        previousHash: current.previousHash,
      });
      const expectedHash = this.computeHash(expectedData);
      if (current.hash !== expectedHash) return false;

      // Structural validation
      if (!isLedgerEntry(current)) return false;
    }
    return true;
  }

  /** Get all entries (immutable copy) */
  getEntries(): ReadonlyArray<LedgerEntry> {
    return this.entries.slice();
  }

  /** Clear ledger (for reset; use sparingly) */
  reset(): void {
    this.entries = [];
  }

  private computeHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Int32
    }
    return hash.toString(16).padStart(64, '0'); // Mock 256-bit hex for deterministic env
  }
}
