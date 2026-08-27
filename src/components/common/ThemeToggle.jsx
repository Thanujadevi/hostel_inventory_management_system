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
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F0F7FF',
        color: isDark ? '#93C5FD' : '#0284C7',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        outline: 'none',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(51, 65, 85, 0.9)' : '#E0F2FE';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.8)' : '#F0F7FF';
      }}
    >
      {isDark ? <Moon size={18} color="#60A5FA" /> : <Sun size={18} color="#0284C7" />}
    </button>
  );
};
