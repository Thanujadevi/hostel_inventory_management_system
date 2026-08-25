import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle light/dark theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isDark ? '#3B82F6' : '#F59E0B',
          color: '#FFFFFF',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease',
          transform: isDark ? 'rotate(360deg)' : 'rotate(0deg)'
        }}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </div>
    </button>
  );
};
