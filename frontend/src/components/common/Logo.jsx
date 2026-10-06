import React, { useState } from 'react';

export const Logo = ({ size = 38, showText = true }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {!imgError ? (
        <img
          src="/logo.png"
          alt="Logo"
          onError={() => setImgError(true)}
          style={{
            height: `${size}px`,
            maxHeight: `${size}px`,
            objectFit: 'contain'
          }}
        />
      ) : (
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '10px',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: `${size * 0.48}px`,
          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
        }}>
          H
        </div>
      )}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            Hostel Inventory
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
            Management
          </div>
        </div>
      )}
    </div>
  );
};
