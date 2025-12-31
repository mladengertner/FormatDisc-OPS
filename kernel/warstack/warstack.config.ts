
export type WarStackRuntime = "browser" | "node";

export interface WarStackConfig {
  runtime: WarStackRuntime;

  determinism: {
    seed: number; // default 42
    deterministicIds: boolean; // true => replay-stable ids
    deterministicBackoffJitter: boolean; // true => jitter via RNG (not Math.random)
  };

  persistence: {
    debounceMs: number; // 1000
    autoPersistIntervalMs: number; // 5000
    onFailureRetry: boolean;
    storageKey: string; // "slavkokernel_v12_6"
  };

  resilience: {
    maxAttempts: number; // 4
    baseDelayMs: number; // 400
    maxDelayMs: number; // 8000
    jitterRatio: number; // 0..1
  };

  manifest: {
    version: "ui-layout-manifest.v2";
    extendsRef: { version: "ui-layout-manifest.v1"; sha256: string }; // MUST be pinned
  };

  ux: {
    microCeremoniesEnabled: boolean;
  };
}

export const DEFAULT_WARSTACK_CONFIG: WarStackConfig = {
  runtime: "browser",
  determinism: {
    seed: 42,
    deterministicIds: true,
    deterministicBackoffJitter: true,
  },
  persistence: {
    debounceMs: 1000,
    autoPersistIntervalMs: 5000,
    onFailureRetry: true,
    storageKey: "slavkokernel_v12_6",
  },
  resilience: {
    maxAttempts: 4,
    baseDelayMs: 400,
    maxDelayMs: 8000,
    jitterRatio: 0.25,
  },
  manifest: {
    version: "ui-layout-manifest.v2",
    // AUDIT-GATE: This SHA256 hash must be calculated from the v1 manifest to ensure integrity.
    extendsRef: { version: "ui-layout-manifest.v1", sha256: "REPLACE_WITH_REAL_SHA256_OF_V1" },
  },
  ux: {
    microCeremoniesEnabled: true,
  },
};
