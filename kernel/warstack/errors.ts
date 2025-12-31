
/**
 * Typed error taxonomy for SlavkoWarStack.
 */

export enum ErrorCode {
  // Recoverable
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RECOVERY_LIMIT_EXCEEDED = 'RECOVERY_LIMIT_EXCEEDED',
  // Terminal
  LEDGER_INTEGRITY_BREACH = 'LEDGER_INTEGRITY_BREACH',
  INVALID_STATE = 'INVALID_STATE',
  CRYPTO_UNAVAILABLE = 'CRYPTO_UNAVAILABLE',
}

interface BaseKernelError extends Error {
  code: ErrorCode;
  cause?: unknown;
}

export class RecoverableKernelError extends Error implements BaseKernelError {
  readonly code: ErrorCode;
  public cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'RecoverableKernelError';
    this.code = code;
    this.cause = cause;
  }
}

export class TerminalKernelError extends Error implements BaseKernelError {
  readonly code: ErrorCode;
  public cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'TerminalKernelError';
    this.code = code;
    this.cause = cause;
  }
}

/** Type guard for Kernel errors */
export function isKernelError(error: unknown): error is BaseKernelError {
  return error instanceof Error && 'code' in error && Object.values(ErrorCode).includes((error as any).code);
}

/** Type guard for Recoverable errors */
export function isRecoverableKernelError(error: unknown): error is RecoverableKernelError {
  return isKernelError(error) && error instanceof RecoverableKernelError;
}
