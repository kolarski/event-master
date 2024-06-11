import type { SnapshotRepository } from "../interfaces/SnapshotRepository.interface";

export class InMemorySnapshotRepository<Aggregate>
  implements SnapshotRepository<Aggregate>
{
  private snapshots: Record<string, Aggregate> = {};

  async saveSnapshot(entityId: string, snapshot: Aggregate): Promise<void> {
    this.snapshots[entityId] = snapshot;
  }

  async getLatestSnapshot(entityId: string): Promise<Aggregate | null> {
    return this.snapshots[entityId] || null;
  }
}
