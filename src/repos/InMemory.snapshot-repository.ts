import type { SnapshotRepository } from "../interfaces/SnapshotRepository.interface";

export class InMemorySnapshotRepository<Aggregate>
  implements SnapshotRepository<Aggregate>
{
  private snapshots: Record<string, Aggregate> = {};

  async saveSnapshot(aggregateId: string, snapshot: Aggregate): Promise<void> {
    this.snapshots[aggregateId] = snapshot;
  }

  async getLatestSnapshot(aggregateId: string): Promise<Aggregate | null> {
    return this.snapshots[aggregateId] || null;
  }
}
