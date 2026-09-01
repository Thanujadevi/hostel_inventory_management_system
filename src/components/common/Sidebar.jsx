import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  FileText, 
  GitCompare, 
  Truck, 
  ShoppingBag, 
  CreditCard, 
  BarChart3, 
  Users, 
  PlusCircle, 
  History, 
  CheckSquare, 
  LogOut,
  Layers,
  User,
  Lock,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { role, user, logout } = useAuth();
  
  // Dynamic Collapsible & Auto-Retract Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('app_sidebar_collapsed') === 'true';
  });

  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const nextState = !prev;
      localStorage.setItem('app_sidebar_collapsed', String(nextState));
      return nextState;
    });
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '76px' : '264px');
  }, [isCollapsed]);

  useEffect(() => {
    const handleStorage = () => {
      const val = localStorage.getItem('app_sidebar_collapsed') === 'true';
      setIsCollapsed(val);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleNavItemClick = (id) => {
    setCurrentTab(id);
    // Auto-retract ("go inside") when an item is selected if collapsed mode is enabled
    if (isCollapsed) {
      setIsHoverExpanded(false);
    }
  };

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stores', label: 'Hostel Stores', icon: Building2 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'requirements', label: 'Hostel Requests', icon: Layers },
    { id: 'quotations', label: 'Price Quotes', icon: GitCompare },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'purchases', label: 'Orders', icon: ShoppingBag },
    { id: 'payments', label: 'Bills & Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const storeNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'raise', label: 'New Request', icon: PlusCircle },
    { id: 'history', label: 'Request History', icon: History },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'stock-update', label: 'Update Stock', icon: CheckSquare }
  ];

  const supplierNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'open-reqs', label: 'Open Requests', icon: FileText },
    { id: 'orders', label: 'Received Orders', icon: ShoppingBag },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const navItems = role === 'admin' ? adminNav : role === 'store' ? storeNav : supplierNav;
  const isSupplierProfilePending = role === 'supplier' && user && user.profileCompleted === false;

  // Effective visually expanded state (either manually uncollapsed OR temporarily hover expanded)
  const isExpandedVisually = !isCollapsed || isHoverExpanded;

  return (
    <aside 
      onMouseEnter={() => isCollapsed && setIsHoverExpanded(true)}
      onMouseLeave={() => isCollapsed && setIsHoverExpanded(false)}
      style={{
        width: isExpandedVisually ? '264px' : '76px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease',
        boxShadow: isExpandedVisually && isCollapsed ? '8px 0 28px rgba(0, 0, 0, 0.15)' : 'var(--shadow-sm)',
        overflowX: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div style={{
        height: 'var(--topbar-height)',
        padding: isExpandedVisually ? '0 16px' : '0 12px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpandedVisually ? 'space-between' : 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Logo size={34} showText={isExpandedVisually} />
        </div>

        {isExpandedVisually && (
          <button
            type="button"
            onClick={toggleCollapse}
            title="Collapse Sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sidebar-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
              e.currentTarget.style.color = 'var(--sidebar-text-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--sidebar-text)';
            }}
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>



      {/* Navigation List */}
      <nav style={{ flex: 1, padding: isExpandedVisually ? '10px 12px' : '16px 8px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const activeMainTab = String(currentTab || '').split(':')[0];
            const isLocked = isSupplierProfilePending && item.id !== 'profile';
            const isActive = !isLocked && activeMainTab === item.id;
            return (
              <li key={item.id} style={{ marginBottom: '4px' }}>
                <button
                  disabled={isLocked}
                  onClick={() => !isLocked && handleNavItemClick(item.id)}
                  title={!isExpandedVisually ? item.label : isLocked ? "Complete profile first" : ""}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isExpandedVisually ? 'flex-start' : 'center',
                    padding: isExpandedVisually ? '10px 14px' : '12px 0',
                    borderRadius: '8px',
                    border: 'none',
                    position: 'relative',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    color: isLocked ? 'var(--color-text-muted)' : isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.5 : 1,
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isLocked) {
                      e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                      e.currentTarget.style.color = 'var(--sidebar-text-hover)';
                      if (isExpandedVisually) e.currentTarget.style.transform = 'translateX(3px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isLocked) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--sidebar-text)';
                      if (isExpandedVisually) e.currentTarget.style.transform = 'translateX(0px)';
                    }
                  }}
                >
                  {/* Left Accent Bar Indicator */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '6px',
                      bottom: '6px',
                      width: '3.5px',
                      borderRadius: '0 4px 4px 0',
                      background: 'var(--sidebar-active-border)'
                    }}></div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isExpandedVisually ? '100%' : 'auto' }}>
                    <Icon 
                      size={20} 
                      color={isActive ? 'var(--sidebar-text-active)' : 'currentColor'} 
                      style={{ flexShrink: 0 }}
                    />
                    {isExpandedVisually && (
                      <span style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        flex: 1
                      }}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {isExpandedVisually && isLocked && <Lock size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer: User Summary & Logout */}
      <div style={{
        padding: isExpandedVisually ? '14px 12px' : '12px 8px',
        borderTop: '1px solid var(--sidebar-border)',
        flexShrink: 0
      }}>
        {isExpandedVisually && user && (
          <div style={{
            background: 'var(--sidebar-hover-bg)',
            border: '1px solid var(--sidebar-border)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              flexShrink: 0
            }}>
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sidebar-text-hover)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || 'Active User'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-text)', textTransform: 'capitalize' }}>
                {role}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={!isExpandedVisually ? "Logout from Session" : ""}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpandedVisually ? 'flex-start' : 'center',
            gap: '12px',
            padding: isExpandedVisually ? '10px 14px' : '10px 0',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--sidebar-text)',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
            e.currentTarget.style.color = 'var(--color-danger-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {isExpandedVisually && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
