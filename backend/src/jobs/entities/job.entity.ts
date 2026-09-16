export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: Date;
}
