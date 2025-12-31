
import { DeterministicRNG } from "./rng";

export class DeterministicIdFactory {
  private counter = 0;
  constructor(private rng: DeterministicRNG, private prefix: string) {}

  nextId(): string {
    // Stable across replay as long as call order is stable
    this.counter += 1;
    const a = this.rng.nextInt(0, 0xffffffff).toString(16).padStart(8, "0");
    const b = this.counter.toString(16).padStart(8, "0");
    return `${this.prefix}_${b}_${a}`;
  }
}
