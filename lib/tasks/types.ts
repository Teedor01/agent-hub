export type TaskStatus = "SUCCESS" | "NO_POSITION" | "ERROR";


export interface DataSourceRecord {
  kind: "VERIFIED_ONCHAIN" | "VERIFIED_EXTERNAL" | "MARKETPLACE_DERIVED";
  address: string | null;
  functionCalled: string;
  chain: string;
  timestamp: string;
}


export interface TaskResult<TOutput> {
  taskId: string;
  agentSlug: string;
  status: TaskStatus;
  input: Record<string, unknown>;
  output: TOutput | null;
  message: string | null;
  dataSources: DataSourceRecord[];
  startedAt: string; 
  finishedAt: string; 
  durationMs: number;
}
