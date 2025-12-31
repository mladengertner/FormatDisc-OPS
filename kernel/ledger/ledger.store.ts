
import type { LedgerEntry, LedgerEventType, LedgerSeverity } from "./ledger.types";
import { hashLedgerEntry } from "./ledger.hash";

export class LedgerStore {
  private entries: LedgerEntry[] = [];

  getAll(): readonly LedgerEntry[] {
    return this.entries;
  }

  async append(input: {
    id: string;
    timestampISO: string;
    eventType: LedgerEventType;
    severity: LedgerSeverity;
    description: string;
    correlationId: string;
    causationId?: string;
    mappingId?: string;
    phaseId?: number;
    metadata?: Record<string, unknown>;
  }): Promise<LedgerEntry> {
    const previousHash = this.entries.length ? this.entries[this.entries.length - 1].hash : undefined;

    const base: Omit<LedgerEntry, "hash"> = {
      id: input.id,
      timestampISO: input.timestampISO,
      eventType: input.eventType,
      severity: input.severity,
      description: input.description,
      correlationId: input.correlationId,
      causationId: input.causationId,
      mappingId: input.mappingId,
      phaseId: input.phaseId,
      previousHash,
      metadata: input.metadata ?? {},
    };

    const hash = await hashLedgerEntry(base);
    const entry: LedgerEntry = { ...base, hash };

    this.entries = [...this.entries, entry];
    return entry;
  }
}
