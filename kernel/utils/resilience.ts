
export type AIErrorCategory = "NETWORK_JITTER" | "API_THRESHOLD" | "LOGIC_BREACH" | "UNKNOWN";

export interface AIError extends Error {
  category: AIErrorCategory;
  statusCode?: number;
  retriable?: boolean;
}

export interface ResiliencePolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

export interface RetryMeta {
  attempt: number;
  backoffMs: number;
  jitterMs: number;
  totalDelayMs: number;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export class ResilienceWrapper {
  static classify(err: unknown): AIError {
    const e = err as any;
    const statusCode = e?.status ?? e?.statusCode ?? e?.response?.status;

    const out: AIError = Object.assign(new Error(e?.message ?? "Unknown AI error"), {
      name: e?.name ?? "AIError",
      statusCode,
      category: "UNKNOWN" as AIErrorCategory,
      retriable: true,
    });

    if (typeof statusCode === "number") {
      if (statusCode === 429) out.category = "API_THRESHOLD";
      else if (statusCode >= 500) out.category = "NETWORK_JITTER";
      else if (statusCode >= 400) {
        out.category = "LOGIC_BREACH";
        out.retriable = false;
      }
    }

    if (e?.category) out.category = e.category;
    if (typeof e?.retriable === "boolean") out.retriable = e.retriable;

    return out;
  }

  static async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    deps: { policy: ResiliencePolicy; jitter01: () => number; onRetry?: (m: RetryMeta, e: AIError) => void },
    onFail?: (e: AIError) => void
  ): Promise<T> {
    let lastErr: AIError | null = null;

    for (let attempt = 1; attempt <= deps.policy.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const e = ResilienceWrapper.classify(err);
        lastErr = e;

        if (!e.retriable || attempt === deps.policy.maxAttempts) {
          onFail?.(e);
          throw e;
        }

        const backoffMs = Math.min(deps.policy.maxDelayMs, deps.policy.baseDelayMs * Math.pow(2, attempt - 1));
        const jitterMs = Math.floor(backoffMs * deps.policy.jitterRatio * deps.jitter01());
        const totalDelayMs = backoffMs + jitterMs;

        deps.onRetry?.({ attempt, backoffMs, jitterMs, totalDelayMs }, e);
        await sleep(totalDelayMs);
      }
    }

    throw lastErr ?? Object.assign(new Error("ResilienceWrapper: fail"), { category: "UNKNOWN" });
  }
}
