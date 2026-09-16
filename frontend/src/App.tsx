import { useState, useMemo } from 'react';
import './App.css';
import { useJobs } from './hooks/useJobs';
import { StatusCard } from './components/StatusCard';
import { CreateJobForm } from './components/CreateJobForm';
import { JobTable } from './components/JobTable';
import type * as JobTypes from './types/job';

type FilterStatus = 'all' | JobTypes.JobStatus;

function App() {
  const { jobs, loading, error, createJob, updateJobStatus, deleteJob } = useJobs();
  const [filter, setFilter] = useState<FilterStatus>('all');

  // Calculate status counts
  const statusCounts: JobTypes.StatusCounts = useMemo(() => {
    return {
      all: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    };
  }, [jobs]);

  // Filter jobs based on selected status
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((job) => job.status === filter);
  }, [jobs, filter]);

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>Job Queue Dashboard</h1>
        </header>
        <div className="loading-container">
          <div className="loading-spinner">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Job Queue Dashboard</h1>
      </header>

      <main className="main-container">
        {error && <div className="error-message">{error}</div>}

        <div className="status-cards-container">
          <StatusCard
            label="All"
            count={statusCounts.all}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatusCard
            label="Pending"
            count={statusCounts.pending}
            active={filter === 'pending'}
            onClick={() => setFilter('pending' as FilterStatus)}
          />
          <StatusCard
            label="Running"
            count={statusCounts.running}
            active={filter === 'running'}
            onClick={() => setFilter('running' as FilterStatus)}
          />
          <StatusCard
            label="Completed"
            count={statusCounts.completed}
            active={filter === 'completed'}
            onClick={() => setFilter('completed' as FilterStatus)}
          />
          <StatusCard
            label="Failed"
            count={statusCounts.failed}
            active={filter === 'failed'}
            onClick={() => setFilter('failed' as FilterStatus)}
          />
        </div>

        <div className="form-section">
          <CreateJobForm onSubmit={createJob} />
        </div>

        <div className="jobs-section">
          <JobTable
            jobs={filteredJobs}
            onUpdateStatus={updateJobStatus}
            onDelete={deleteJob}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
