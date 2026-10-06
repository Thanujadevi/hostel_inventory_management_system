import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = '600px' }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  const currentMaxWidth = isZoomed ? '95vw' : maxWidth;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: currentMaxWidth,
          maxHeight: isZoomed ? '92vh' : '85vh',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Modal Zoom In / Maximize & Zoom Out / Restore button */}
            <button 
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? "Zoom Out / Minimize Modal" : "Zoom In / Maximize Modal"}
              style={{
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              {isZoomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button 
              onClick={onClose}
              title="Close Modal"
              style={{
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
