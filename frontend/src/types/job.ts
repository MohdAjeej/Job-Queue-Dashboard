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
  createdAt: string;
}

export interface CreateJobData {
  title: string;
  type: string;
}

export interface StatusCounts {
  all: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}
