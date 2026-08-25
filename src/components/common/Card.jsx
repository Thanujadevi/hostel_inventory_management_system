import React from 'react';

export const Card = ({ children, title, value, icon: Icon, iconBg = 'var(--color-primary-light)', iconColor = 'var(--color-primary)', subtitle, style, className = '' }) => {
  if (children) {
    return (
      <div className={`card ${className}`} style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', ...style }}>
        {children}
      </div>
    );
  }

  return (
    <div className={`card card-hover kpi-card ${className}`} style={style}>
      {Icon && (
        <div className="kpi-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={24} />
        </div>
      )}
      <div>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
