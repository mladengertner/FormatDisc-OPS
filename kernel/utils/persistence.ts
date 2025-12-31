
export interface PersistencePolicy {
  debounceMs: number;
  autoPersistIntervalMs: number;
  onFailureRetry: boolean;
}

export class StatePersistence {
  private debounceTimer: number | null = null;
  private intervalTimer: number | null = null;

  constructor(private policy: PersistencePolicy) {}

  scheduleSave(saveFn: () => Promise<void>) {
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => void saveFn(), this.policy.debounceMs);
  }

  async forceSave(saveFn: () => Promise<void>) {
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = null;
    await saveFn();
  }

  startAutoPersist(saveFn: () => Promise<void>) {
    this.stopAutoPersist();
    this.intervalTimer = window.setInterval(() => void saveFn(), this.policy.autoPersistIntervalMs);
  }

  stopAutoPersist() {
    if (this.intervalTimer) window.clearInterval(this.intervalTimer);
    this.intervalTimer = null;
  }
}
