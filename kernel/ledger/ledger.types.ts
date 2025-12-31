
export type LedgerEventType =
  | "INTENT_CAPTURE"
  | "AI_INVOCATION"
  | "AI_RETRY"
  | "AI_RESPONSE"
  | "PHASE_START"
  | "PHASE_COMMIT"
  | "PHASE_BREACH"
  | "STATE_PERSISTED"
  | "CONTEXT_SHIFT"
  | "RUNTIME_IDENTIFIED"
  | "MANIFEST_PINNED"
  | "REPORT_GENERATED"
  | "BLUEPRINT_COMMIT"
  | "BLUEPRINT_PURGE"
  | "BOOT_INIT"
  | "ERROR";

export type LedgerSeverity = "INFO" | "SUCCESS" | "WARN" | "CRITICAL";

export interface LedgerEntry {
  id: string;
  timestampISO: string;

  eventType: LedgerEventType;
  severity: LedgerSeverity;

  description: string; // Keeping description for UI readability

  correlationId: string;
  causationId?: string;

  mappingId?: string;
  phaseId?: number;

  previousHash?: string;
  hash?: string;

  metadata?: Record<string, unknown>;
}
