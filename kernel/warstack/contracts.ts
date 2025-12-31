
/**
 * Runtime contracts for SlavkoWarStack.
 * Uses pure TypeScript type guards and narrowing functions for validation.
 */

/** Branded type for unique IDs */
export type Id = string & { __brand: 'Id' };

/** Utility to create branded IDs */
export function createId(value: string): Id {
  if (typeof value !== 'string' || value.length < 8) {
    throw new Error('Invalid ID: must be a string of at least 8 characters');
  }
  return value as Id;
}

/** WarStack operational modes */
export type WarStackMode = 'IDLE' | 'ACTIVE' | 'RECOVERY' | 'WAR' | 'FUSION' | 'SCORING' | 'INDIFFERENT';

/** Event types for kernel commands */
export type KernelEvent =
  | { type: 'INIT'; payload: { seed: number } }
  | { type: 'COMMAND'; payload: { name: string; args: Record<string, unknown> } }
  | { type: 'MODE_SWITCH'; payload: { mode: WarStackMode } }
  | { type: 'LOG'; payload: { severity: string; eventType: string; description: string; metadata?: any } };

/** Guard for KernelEvent */
export function isKernelEvent(value: unknown): value is KernelEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.type !== 'string') return false;
  if (!['INIT', 'COMMAND', 'MODE_SWITCH', 'LOG'].includes(obj.type)) return false;
  if (typeof obj.payload !== 'object' || obj.payload === null) return false;
  return true;
}

/** Guard for WarStackMode */
export function isWarStackMode(value: unknown): value is WarStackMode {
  return typeof value === 'string' && ['IDLE', 'ACTIVE', 'RECOVERY', 'WAR', 'FUSION', 'SCORING', 'INDIFFERENT'].includes(value);
}

/** Ledger entry structure */
export interface LedgerEntry {
  id: Id;
  timestamp: number; // Unix timestamp
  event: KernelEvent;
  previousHash: string; // Hex string
  hash: string; // Hex string
}

/** Guard for LedgerEntry */
export function isLedgerEntry(value: unknown): value is LedgerEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    obj.id.length >= 8 &&
    typeof obj.timestamp === 'number' &&
    isKernelEvent(obj.event) &&
    typeof obj.previousHash === 'string' &&
    obj.previousHash.length === 64 &&
    typeof obj.hash === 'string' &&
    obj.hash.length === 64
  );
}

/** Kernel state snapshot */
export interface KernelState {
  mode: WarStackMode;
  seed: number;
  lastEventId?: Id;
  cognitiveLoad: number;
}

/** Guard for KernelState */
export function isKernelState(value: unknown): value is KernelState {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    isWarStackMode(obj.mode) &&
    typeof obj.seed === 'number' &&
    (obj.lastEventId === undefined || (typeof obj.lastEventId === 'string' && obj.lastEventId.length >= 8))
  );
}
