import { useState, useEffect, useCallback } from 'react';
import type * as JobTypes from '../types/job';
import { jobsApi } from '../api/jobsApi';

export const useJobs = () => {
  const [jobs, setJobs] = useState<JobTypes.Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobsApi.getJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = async (data: JobTypes.CreateJobData): Promise<void> => {
    try {
      setError(null);
      const newJob = await jobsApi.createJob(data);
      setJobs((prev) => [newJob, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateJobStatus = async (id: string, status: JobTypes.JobStatus): Promise<void> => {
    try {
      setError(null);
      const updatedJob = await jobsApi.updateJobStatus(id, status);
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? updatedJob : job))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job status';
      setError(errorMessage);
      
      // Refresh jobs to get the latest state after a conflict
      await fetchJobs();
      
      throw new Error(errorMessage);
    }
  };

  const deleteJob = async (id: string): Promise<void> => {
    try {
      setError(null);
      await jobsApi.deleteJob(id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJobStatus,
    deleteJob,
    refreshJobs: fetchJobs,
  };
};
