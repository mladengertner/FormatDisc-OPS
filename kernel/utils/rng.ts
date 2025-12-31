
export class DeterministicRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  nextInt(minInclusive: number, maxExclusive: number): number {
    const span = Math.max(0, maxExclusive - minInclusive);
    if (span === 0) return minInclusive;
    return minInclusive + Math.floor(this.next() * span);
  }

  snapshot(): number {
    return this.state >>> 0;
  }
}
