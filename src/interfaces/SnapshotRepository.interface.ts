export interface SnapshotRepository<Aggregate> {
  saveSnapshot(entityId: string, snapshot: Aggregate): Promise<void>;
  getLatestSnapshot(entityId: string): Promise<Aggregate | null>;
}
