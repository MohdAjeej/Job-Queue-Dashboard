import React, { useState } from 'react';
import type * as JobTypes from '../types/job';
import '../styles/JobTable.css';

interface JobTableProps {
  jobs: JobTypes.Job[];
  onUpdateStatus: (id: string, status: JobTypes.JobStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  onUpdateStatus,
  onDelete,
}) => {
  const [loadingJobs, setLoadingJobs] = useState<Record<string, string>>({});
  const [deletingJobs, setDeletingJobs] = useState<Set<string>>(new Set());

  const handleStatusUpdate = async (id: string, status: JobTypes.JobStatus) => {
    setLoadingJobs((prev) => ({ ...prev, [id]: status }));
    
    try {
      await onUpdateStatus(id, status);
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setLoadingJobs((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingJobs((prev) => new Set(prev).add(id));

    try {
      await onDelete(id);
    } catch (error) {
      // Error is handled by the parent component
      setDeletingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusClass = (status: JobTypes.JobStatus) => {
    return `status-badge status-${status}`;
  };

  const getAvailableActions = (status: JobTypes.JobStatus) => {
    switch (status) {
      case 'pending':
        return [
          { label: 'Run', status: 'running' as JobTypes.JobStatus },
          { label: 'Fail', status: 'failed' as JobTypes.JobStatus },
        ];
      case 'running':
        return [
          { label: 'Complete', status: 'completed' as JobTypes.JobStatus },
          { label: 'Fail', status: 'failed' as JobTypes.JobStatus },
        ];
      case 'completed':
      case 'failed':
        return [];
      default:
        return [];
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <p>No jobs found</p>
      </div>
    );
  }

  return (
    <div className="job-table-container">
      <table className="job-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isLoading = loadingJobs[job.id];
            const isDeleting = deletingJobs.has(job.id);
            const actions = getAvailableActions(job.status);

            return (
              <tr
                key={job.id}
                className={isDeleting ? 'deleting' : ''}
              >
                <td className="job-title">{job.title}</td>
                <td>{job.type}</td>
                <td>
                  <span className={getStatusClass(job.status)}>
                    {job.status}
                  </span>
                </td>
                <td className="job-date">{formatDate(job.createdAt)}</td>
                <td className="job-actions">
                  {actions.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => handleStatusUpdate(job.id, action.status)}
                      disabled={isLoading !== undefined || isDeleting}
                      className="action-button"
                    >
                      {isLoading === action.status ? 'Loading...' : action.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDelete(job.id, job.title)}
                    disabled={isLoading !== undefined || isDeleting}
                    className="action-button delete-button"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
