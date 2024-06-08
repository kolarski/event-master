export interface SnapshotRepository<Aggregate> {
  saveSnapshot(streamId: string, snapshot: Aggregate): Promise<void>;
  getLatestSnapshot(streamId: string): Promise<Aggregate | null>;
}
