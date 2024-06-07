export interface SnapshotRepository<Aggregate> {
  saveSnapshot(aggregateId: string, snapshot: Aggregate): Promise<void>;
  getLatestSnapshot(aggregateId: string): Promise<Aggregate | null>;
}
