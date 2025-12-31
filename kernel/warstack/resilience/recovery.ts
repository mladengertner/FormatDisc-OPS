
import { SlavkoWarStack } from '../SlavkoWarStack';
import { RecoverableKernelError, ErrorCode } from '../errors';

const MAX_RETRIES = 3;
const retryCounts = new Map<SlavkoWarStack, number>();

export function recoverFromError(kernel: SlavkoWarStack, error: RecoverableKernelError): void {
  const count = retryCounts.get(kernel) ?? 0;

  if (count >= MAX_RETRIES) {
    throw new RecoverableKernelError(ErrorCode.RECOVERY_LIMIT_EXCEEDED, 'Max retries exceeded', error);
  }

  retryCounts.set(kernel, count + 1);

  if (error.code === ErrorCode.VALIDATION_FAILED) {
    // Attempt to reset to a known good state or just log and continue
    console.warn(`Kernel recovering from validation failure: ${error.message}`);
  }

  console.warn(`Recovered from ${error.code}: ${error.message}`);
}
