export type ReconciliationStatus = "MATCHED" | "MISMATCH";
export type TriggerType = "SCHEDULED" | "MANUAL" | "REPLAY_VALIDATION";
export type ReplayStatus = "REQUESTED" | "RUNNING" | "COMPLETED" | "FAILED";
export type ReplayCheckpointStatus = "PENDING" | "RUNNING" | "COMPLETED";
export type MismatchType =
  | "KAFKA_VS_SOURCE_OBSERVATIONS"
  | "SOURCE_OBSERVATIONS_VS_UNIQUE_EVENTS"
  | "UNIQUE_EVENTS_VS_DATABASE"
  | "DATABASE_VS_AGGREGATE_COUNT"
  | "DATABASE_VS_AGGREGATE_AMOUNT";

export interface BusinessEvent {
  eventId: string;
  businessKey: string;
  eventTime: string;
  amount: number;
  attributes: Record<string, unknown>;
}

export interface DailyMetrics {
  businessDate: string;
  consumedEventCount: number;
  uniqueEventCount: number;
  databaseRecordCount: number;
  aggregateRecordCount: number;
  databaseAmount: number;
  aggregateAmount: number;
  updatedAt: string;
}

export interface KafkaPartitionRange {
  partition: number;
  startOffset: number;
  endOffset: number;
}

export interface ReconciliationIssue {
  type: MismatchType;
  expected: string;
  actual: string;
  delta: string;
  action: string;
}

export interface ReconciliationReport {
  reportId: string;
  businessDate: string;
  triggerType: TriggerType;
  status: ReconciliationStatus;
  kafkaEventCount: number;
  consumedEventCount: number;
  uniqueEventCount: number;
  databaseRecordCount: number;
  aggregateRecordCount: number;
  databaseAmount: number;
  aggregateAmount: number;
  sourceOffsets: KafkaPartitionRange[];
  issues: ReconciliationIssue[];
  correlationId: string;
  createdAt: string;
}

export interface ReplayJob {
  jobId: string;
  idempotencyKey: string;
  fromDate: string;
  toDate: string;
  dryRun: boolean;
  status: ReplayStatus;
  discoveredEvents: number;
  replayedEvents: number;
  attemptCount: number;
  requestedBy: string;
  correlationId: string;
  errorMessage: string | null;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  commandPublishedAt: string | null;
  heartbeatAt: string | null;
}

export interface ReplayPartitionCheckpoint {
  jobId: string;
  sourceTopic: string;
  sourcePartition: number;
  startOffset: number;
  endOffset: number;
  nextOffset: number;
  discoveredEvents: number;
  replayedEvents: number;
  status: ReplayCheckpointStatus;
  updatedAt: string;
}

export interface HealthComponent {
  status: string;
  details?: Record<string, unknown> | undefined;
}

export interface HealthResponse {
  status: string;
  components?: Record<string, HealthComponent> | undefined;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
}
