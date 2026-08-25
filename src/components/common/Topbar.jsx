import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeToggle } from './ThemeToggle';
import { Menu } from 'lucide-react';

export const Topbar = () => {
  const { role, user } = useAuth();
  const { toastMessage } = useData();

  const userName = user?.name || (role === 'admin' ? 'Admin User' : 'Store User');
  const roleName = role === 'admin' ? 'Chief Warden / Admin' : role === 'store' ? 'Hostel Store Manager' : 'Authorized Supplier';
  const initial = userName.charAt(0).toUpperCase();

  const toggleSidebar = () => {
    const isCollapsed = localStorage.getItem('app_sidebar_collapsed') === 'true';
    const nextState = !isCollapsed;
    localStorage.setItem('app_sidebar_collapsed', String(nextState));
    document.documentElement.style.setProperty('--sidebar-width', nextState ? '76px' : '260px');
    // Dispatch custom event to sync sidebar UI state
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      backgroundColor: 'var(--color-surface-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 90,
      boxShadow: 'var(--shadow-sm)',
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Left: Sidebar Toggle & Welcome Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={toggleSidebar}
          title="Toggle Navigation Sidebar"
          style={{
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-secondary)',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.borderColor = 'var(--color-border-dark)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
            Welcome {role === 'admin' ? 'Admin' : role === 'store' ? 'Store Manager' : 'Supplier'} 👋
          </h2>
        </div>
      </div>

      {/* Right: Theme Toggle, User Info & Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <ThemeToggle />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface-hover)', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--color-border)' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {userName}
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.2 }}>
              {roleName}
            </span>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }}>
            {initial}
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            {toastMessage.message}
          </div>
        </div>
      )}
    </header>
  );
};
