
import { isoNow } from '../utils/time';

/**
 * NetErrorKind - Authoritative error taxonomy for SlavkoKernel.
 */
export enum NetErrorKind {
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_ABORTED = 'NETWORK_ABORTED',
  NETWORK_4XX = 'NETWORK_4XX',
  NETWORK_5XX = 'NETWORK_5XX',
  NETWORK_MALFORMED_RESPONSE = 'NETWORK_MALFORMED_RESPONSE',
  UNKNOWN_IO = 'UNKNOWN_IO'
}

export class NetError extends Error {
  readonly kind: NetErrorKind;
  readonly status?: number;
  readonly timestamp: string;

  constructor(kind: NetErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'NetError';
    this.kind = kind;
    this.status = status;
    this.timestamp = isoNow();
  }
}

export interface NetFetchOptions extends RequestInit {
  timeoutMs?: number;
  retry?: boolean;
}

/**
 * Authoritative netFetch wrapper.
 * Ensures determinism and zero console noise.
 */
export async function netFetch<T>(
  url: string,
  options: NetFetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 10000,
    retry = false,
    ...fetchOpts
  } = options;

  const attempt = async (retryCycle = false): Promise<any> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...fetchOpts.headers,
        },
      });

      clearTimeout(id);

      if (!response.ok) {
        const kind = response.status >= 500 ? NetErrorKind.NETWORK_5XX : NetErrorKind.NETWORK_4XX;
        throw new NetError(kind, `HTTP_${response.status}: ${response.statusText}`, response.status);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();

    } catch (err: any) {
      clearTimeout(id);

      if (err.name === 'AbortError') {
        throw new NetError(NetErrorKind.NETWORK_TIMEOUT, `TIMEOUT_EXCEEDED: ${timeoutMs}ms`);
      }

      if (err instanceof NetError) throw err;

      throw new NetError(NetErrorKind.UNKNOWN_IO, err.message || 'IO_FAULT');
    }
  };

  try {
    return await attempt();
  } catch (err: any) {
    // Silent Retry Logic: Max 1 attempt for recoverable errors
    if (retry && (err.kind === NetErrorKind.NETWORK_TIMEOUT || err.kind === NetErrorKind.NETWORK_4XX)) {
      // Small deterministic backoff (no UI jitter)
      await new Promise(res => setTimeout(res, 300));
      return await attempt(true);
    }
    throw err;
  }
}
