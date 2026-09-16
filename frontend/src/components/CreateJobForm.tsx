import React, { useState } from 'react';
import '../styles/CreateJobForm.css';

interface CreateJobFormProps {
  onSubmit: (data: { title: string; type: string }) => Promise<void>;
}

export const CreateJobForm: React.FC<CreateJobFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !type.trim()) {
      setError('Both title and type are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ title: title.trim(), type: type.trim() });
      setTitle('');
      setType('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-job-form" onSubmit={handleSubmit}>
      <h2>Create New Job</h2>
      
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Generate monthly invoice"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <input
            id="type"
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g., invoice"
            disabled={isSubmitting}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !type.trim()}
          className="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </form>
  );
};
