import axios from 'axios';
import type * as JobTypes from '../types/job';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jobsApi = {
  async getJobs(): Promise<JobTypes.Job[]> {
    const response = await api.get<JobTypes.Job[]>('/jobs');
    return response.data;
  },

  async createJob(data: JobTypes.CreateJobData): Promise<JobTypes.Job> {
    const response = await api.post<JobTypes.Job>('/jobs', data);
    return response.data;
  },

  async updateJobStatus(id: string, status: JobTypes.JobStatus): Promise<JobTypes.Job> {
    const response = await api.patch<JobTypes.Job>(`/jobs/${id}/status`, { status });
    return response.data;
  },

  async deleteJob(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },
};
