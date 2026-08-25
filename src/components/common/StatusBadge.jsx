import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const s = String(status).toLowerCase();

  let badgeClass = 'badge-pending';
  let label = status;

  if (s.includes('pending')) {
    badgeClass = 'badge-pending';
  } else if (s.includes('open')) {
    badgeClass = 'badge-open';
  } else if (s.includes('approved') || s.includes('accepted') || s.includes('delivered') || s.includes('completed') || s.includes('active') || s.includes('paid')) {
    badgeClass = 'badge-approved';
  } else if (s.includes('rejected') || s.includes('cancelled') || s.includes('inactive') || s.includes('out of stock')) {
    badgeClass = 'badge-rejected';
  } else if (s.includes('submitted')) {
    badgeClass = 'badge-purple';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }} />
      {label}
    </span>
  );
};
