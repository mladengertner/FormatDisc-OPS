
import type { LedgerEntry } from "./ledger.types";

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashLedgerEntry(entry: Omit<LedgerEntry, "hash">): Promise<string> {
  const canonical = JSON.stringify({
    id: entry.id,
    timestampISO: entry.timestampISO,
    eventType: entry.eventType,
    severity: entry.severity,
    description: entry.description,
    correlationId: entry.correlationId,
    causationId: entry.causationId ?? null,
    mappingId: entry.mappingId ?? null,
    phaseId: entry.phaseId ?? null,
    previousHash: entry.previousHash ?? null,
    metadata: entry.metadata ?? null,
  });
  return sha256(canonical);
}
