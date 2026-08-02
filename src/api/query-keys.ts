export const queryKeys = {
  health: ["health"] as const,
  metrics: (date: string) => ["daily-metrics", date] as const,
  reports: (filters: object) => ["reports", filters] as const,
  report: (id: string) => ["report", id] as const,
  replay: (id: string) => ["replay", id] as const,
  replayCheckpoints: (id: string) => ["replay-checkpoints", id] as const,
};
