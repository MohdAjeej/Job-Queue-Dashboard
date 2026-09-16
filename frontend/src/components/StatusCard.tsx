import React from 'react';
import '../styles/StatusCard.css';

interface StatusCardProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  count,
  active,
  onClick,
}) => {
  return (
    <button
      className={`status-card ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="status-card-label">{label}</div>
      <div className="status-card-count">{count}</div>
    </button>
  );
};
