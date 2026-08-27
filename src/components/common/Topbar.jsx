import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeToggle } from './ThemeToggle';
import { Menu, ShieldCheck, ZoomIn, ZoomOut, User, Mail, Phone, Lock, Save, X } from 'lucide-react';

export const Topbar = () => {
  const { role, user, updateAuthUser } = useAuth();
  const { toastMessage, showToast } = useData();

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings form states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 140));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 75));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  useEffect(() => {
    document.documentElement.style.fontSize = `${(zoomLevel / 100) * 16}px`;
  }, [zoomLevel]);

  const roleName = role === 'admin' ? 'Chief Warden / Admin' : role === 'store' ? 'Hostel Store Manager' : 'Authorized Supplier';
  const roleBadge = role === 'admin' ? 'Administrator' : role === 'store' ? 'Store Manager' : 'Supplier';
  const rawName = user?.name || '';
  const userName = (!rawName || rawName === roleName || rawName === 'Chief Warden / Admin')
    ? (role === 'admin' ? 'Chief Warden' : role === 'store' ? 'Store In-Charge' : 'Supplier Partner')
    : rawName;
  const initial = userName.charAt(0).toUpperCase();

  const toggleSettingsModal = () => {
    if (!isSettingsOpen) {
      setProfileName(userName);
      setProfileEmail(user?.email || '24104063@nec.edu.in');
      setProfilePhone(user?.phone || '+91 9876543210');
      setProfilePassword('');
    }
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateAuthUser({
      name: profileName,
      email: profileEmail,
      phone: profilePhone
    });
    if (showToast) {
      showToast("Account profile settings updated successfully!", "success");
    }
    setIsSettingsOpen(false);
  };

  const toggleSidebar = () => {
    const isCollapsed = localStorage.getItem('app_sidebar_collapsed') === 'true';
    const nextState = !isCollapsed;
    localStorage.setItem('app_sidebar_collapsed', String(nextState));
    document.documentElement.style.setProperty('--sidebar-width', nextState ? '76px' : '264px');
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
      padding: '0 28px',
      zIndex: 90,
      boxShadow: 'var(--shadow-sm)',
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Left: Sidebar Toggle & Portal Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={toggleSidebar}
          title="Toggle Navigation Sidebar"
          style={{
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            color: 'var(--color-primary)',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-hover)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'var(--color-primary-light)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-primary)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            <ShieldCheck size={13} />
            {role === 'admin' ? 'ADMIN PORTAL' : role === 'store' ? 'STORE PORTAL' : 'SUPPLIER PORTAL'}
          </div>
        </div>
      </div>

      {/* Right: Zoom In/Out, Theme Toggle, User Info & Profile Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        {/* Zoom In & Zoom Out Controller */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '3px 6px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 75}
            title="Zoom Out (-10%)"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: zoomLevel <= 75 ? 'not-allowed' : 'pointer',
              opacity: zoomLevel <= 75 ? 0.4 : 1,
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ZoomOut size={16} />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Click to reset zoom to 100%"
            style={{
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: zoomLevel === 100 ? 'var(--color-text-primary)' : 'var(--color-primary)',
              cursor: 'pointer'
            }}
          >
            {zoomLevel}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 140}
            title="Zoom In (+10%)"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: zoomLevel >= 140 ? 'not-allowed' : 'pointer',
              opacity: zoomLevel >= 140 ? 0.4 : 1,
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <ThemeToggle />

        {/* Profile Card Button */}
        <div 
          onClick={toggleSettingsModal}
          title="Click to open Account Settings & Edit Profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: isSettingsOpen ? 'var(--color-primary-light)' : 'var(--color-surface)',
            padding: '6px 14px',
            borderRadius: '12px',
            border: `1px solid ${isSettingsOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            if (!isSettingsOpen) e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              {userName}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600, lineHeight: 1.2 }}>
              {roleBadge}
            </span>
          </div>

          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #0369A1 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 0 0 2px var(--color-primary-light), 0 3px 8px rgba(2, 132, 199, 0.3)'
          }}>
            {initial}
          </div>
        </div>

        {/* Floating Profile Settings Dropdown Card anchored below profile icon */}
        {isSettingsOpen && (
          <>
            {/* Backdrop overlay to close when clicking outside */}
            <div 
              onClick={() => setIsSettingsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 95
              }}
            />

            <div 
              style={{
                position: 'absolute',
                top: 'calc(var(--topbar-height) - 6px)',
                right: '0px',
                width: '380px',
                maxHeight: 'calc(100vh - 80px)',
                overflowY: 'auto',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg), 0 16px 36px rgba(0,0,0,0.18)',
                zIndex: 100,
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="var(--color-primary)" /> Account Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div style={{
                  padding: '10px 12px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={16} color="var(--color-primary)" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {roleBadge} Account ({role === 'admin' ? 'Chief Warden' : 'Store Manager'})
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} /> Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Chief Warden"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} /> Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="24104063@nec.edu.in"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} /> Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} /> New Password (Optional)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsSettingsOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={14} /> Save Profile Settings
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
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
