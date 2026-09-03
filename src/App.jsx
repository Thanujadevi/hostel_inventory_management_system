import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

import { Sidebar } from './components/common/Sidebar';
import { Topbar } from './components/common/Topbar';

import { Login } from './pages/auth/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminStores } from './pages/admin/Stores';
import { AdminSuppliers } from './pages/admin/Suppliers';
import { AdminInventory } from './pages/admin/Inventory';
import { AdminRequirements } from './pages/admin/Requirements';
import { AdminQuotationCompare } from './pages/admin/QuotationCompare';
import { AdminPurchaseOrders } from './pages/admin/PurchaseOrders';
import { AdminPayments } from './pages/admin/Payments';
import { AdminReports } from './pages/admin/Reports';
import { AdminUsers } from './pages/admin/Users';

// Store Pages
import { StoreDashboard } from './pages/store/Dashboard';
import { StoreInventory } from './pages/store/Inventory';
import { StoreRaiseRequirement } from './pages/store/RaiseRequirement';
import { StoreRequirementHistory } from './pages/store/RequirementHistory';
import { StorePurchaseOrders } from './pages/store/PurchaseOrders';
import { StoreStockUpdate } from './pages/store/StockUpdate';

// Supplier Pages
import { SupplierDashboard } from './pages/supplier/Dashboard';
import { SupplierRequirements } from './pages/supplier/Requirements';
import { SupplierPurchaseOrders } from './pages/supplier/PurchaseOrders';
import { SupplierProfile } from './pages/supplier/Profile';

const AppContent = () => {
  const { isLoggedIn, role, user, logout } = useAuth();

  const [currentTab, setCurrentTabState] = useState(() => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash && hash !== 'login') return hash;
      const savedTab = localStorage.getItem(`app_active_tab_${role}`);
      if (savedTab === 'users') return 'dashboard';
      return savedTab || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  // Wrapped tab switcher that updates browser history so Back/Forward arrows work
  const setCurrentTab = (newTab, options = { pushHistory: true }) => {
    if (!newTab) return;
    setCurrentTabState(newTab);
    if (role) {
      try {
        localStorage.setItem(`app_active_tab_${role}`, newTab);
      } catch (e) { }
    }
    if (options.pushHistory !== false) {
      const newHash = `#${newTab}`;
      if (window.location.hash !== newHash) {
        window.history.pushState({ tab: newTab, role, isLoggedIn: true }, '', newHash);
      }
    }
  };

  // Sync window location hash and history popstate (Browser Back / Forward arrows)
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash || hash === 'login') {
        if (isLoggedIn) {
          logout();
        }
      } else {
        if (isLoggedIn) {
          setCurrentTabState(hash);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, logout]);

  // Sync history state on Auth state transition (Login / Logout / App Launch)
  useEffect(() => {
    if (!isLoggedIn) {
      if (window.location.hash !== '#login') {
        window.history.replaceState({ tab: 'login', isLoggedIn: false }, '', '#login');
      }
    } else {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const initialTab = (hash && hash !== 'login') ? hash : (currentTab || 'dashboard');
      if (currentTab !== initialTab) {
        setCurrentTabState(initialTab);
      }
      const targetHash = `#${initialTab}`;
      if (window.location.hash === '#login' || !window.location.hash) {
        window.history.pushState({ tab: initialTab, role, isLoggedIn: true }, '', targetHash);
      } else if (window.location.hash !== targetHash) {
        window.history.replaceState({ tab: initialTab, role, isLoggedIn: true }, '', targetHash);
      }
    }
  }, [isLoggedIn, role]);

  // Direct incomplete supplier to profile page
  useEffect(() => {
    if (role === 'supplier' && user && user.profileCompleted === false) {
      setCurrentTab('profile');
    }
  }, [role, user?.profileCompleted]);

  if (!isLoggedIn) {
    return <Login />;
  }

  const renderModulePage = () => {
    const activeMainTab = String(currentTab).split(':')[0];
    if (role === 'admin') {
      switch (activeMainTab) {
        case 'dashboard': return <AdminDashboard setCurrentTab={setCurrentTab} />;
        case 'stores': return <AdminStores />;
        case 'suppliers': return <AdminSuppliers />;
        case 'inventory': return <AdminInventory />;
        case 'requirements': return <AdminRequirements currentTab={currentTab} />;
        case 'quotations': return <AdminQuotationCompare />;
        case 'purchases': return <AdminPurchaseOrders />;
        case 'payments': return <AdminPayments />;
        case 'reports': return <AdminReports />;
        case 'users': return <AdminUsers />;
        default: return <AdminDashboard setCurrentTab={setCurrentTab} />;
      }
    } else if (role === 'store') {
      switch (currentTab) {
        case 'dashboard': return <StoreDashboard setCurrentTab={setCurrentTab} />;
        case 'inventory': return <StoreInventory setCurrentTab={setCurrentTab} />;
        case 'raise': return <StoreRaiseRequirement setCurrentTab={setCurrentTab} />;
        case 'history': return <StoreRequirementHistory />;
        case 'orders': return <StorePurchaseOrders setCurrentTab={setCurrentTab} />;
        case 'stock-update': return <StoreStockUpdate setCurrentTab={setCurrentTab} />;
        default: return <StoreDashboard setCurrentTab={setCurrentTab} />;
      }
    } else if (role === 'supplier') {
      if (user && user.profileCompleted === false) {
        return <SupplierProfile onComplete={() => setCurrentTab('dashboard')} />;
      }
      switch (currentTab) {
        case 'dashboard': return <SupplierDashboard setCurrentTab={setCurrentTab} />;
        case 'open-reqs': return <SupplierRequirements />;
        case 'orders': return <SupplierPurchaseOrders />;
        case 'profile': return <SupplierProfile onComplete={() => setCurrentTab('dashboard')} />;
        default: return <SupplierDashboard setCurrentTab={setCurrentTab} />;
      }
    }

    return <AdminDashboard setCurrentTab={setCurrentTab} />;
  };

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="main-layout">
        <Topbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="main-content">
          {renderModulePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

