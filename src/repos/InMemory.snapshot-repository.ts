import type { SnapshotRepository } from "../interfaces/SnapshotRepository.interface";

export class InMemorySnapshotRepository<Aggregate>
  implements SnapshotRepository<Aggregate>
{
  private snapshots: Record<string, Aggregate> = {};

  async saveSnapshot(streamId: string, snapshot: Aggregate): Promise<void> {
    this.snapshots[streamId] = snapshot;
  }

  async getLatestSnapshot(streamId: string): Promise<Aggregate | null> {
    return this.snapshots[streamId] || null;
  }
}
