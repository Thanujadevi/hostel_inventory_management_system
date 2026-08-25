import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, FileText, ShoppingBag, PlusCircle, AlertTriangle, ArrowRight, Lock, Unlock, Clock } from 'lucide-react';

export const StoreDashboard = ({ setCurrentTab }) => {
  const { currentStore } = useAuth();
  const { requests, getStoreItems, purchases, requirementPeriod, isRequirementWindowActive } = useData();

  const storeId = currentStore?.id;
  const storeReqs = storeId ? requests.filter(r => r.int_Store_Id === storeId) : [];
  const storePOs = storeId ? purchases.filter(p => p.int_Store_Id === storeId) : [];

  const storeItems = getStoreItems(storeId);
  const pendingReqs = storeReqs.filter(r => r.txt_Status === 'Pending');
  const windowActive = isRequirementWindowActive();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{currentStore?.name || 'Hostel Store'} Dashboard</h1>
        </div>
        <button 
          className={`btn ${windowActive ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setCurrentTab('raise')}
        >
          {windowActive ? <PlusCircle size={16} /> : <Lock size={16} />}
          {windowActive ? 'Raise New Requirement' : 'Requirement Window Status'}
        </button>
      </div>

      {/* Requirement Window Banner */}
      <div className="card" style={{
        marginBottom: '24px',
        borderLeft: `5px solid ${windowActive ? 'var(--color-success)' : 'var(--color-danger)'}`,
        background: windowActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: windowActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: windowActive ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {windowActive ? <Unlock size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${windowActive ? 'badge-approved' : 'badge-rejected'}`}>
                  {windowActive ? 'REQUIREMENT WINDOW OPEN' : 'REQUIREMENT WINDOW CLOSED'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Target Month: {requirementPeriod?.txt_Month || 'August'} {requirementPeriod?.int_Year || 2026}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 0' }}>
                {requirementPeriod?.txt_Title || 'Monthly Hostel Inventory Requirement Window'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Deadline
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: windowActive ? 'var(--color-primary)' : 'var(--color-danger-text)' }}>
                {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Closed'}
              </div>
            </div>

            {windowActive ? (
              <button className="btn btn-primary btn-sm" onClick={() => setCurrentTab('raise')}>
                <PlusCircle size={14} /> Raise Requirement Now
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('raise')}>
                View Window Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <Card
          title="Store Stock Items"
          value={storeItems.length}
          icon={Package}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          subtitle="Catalog products maintained"
        />
        <Card
          title="Submitted Requirements"
          value={storeReqs.length}
          icon={FileText}
          iconBg="var(--color-info-bg)"
          iconColor="var(--color-info-text)"
          subtitle="Total requests raised"
        />
        <Card
          title="Approved POs"
          value={storePOs.length}
          icon={ShoppingBag}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success-text)"
          subtitle="Approved orders in pipeline"
        />
        <Card
          title="Low Stock Watchlist"
          value={lowStockItems.length}
          icon={AlertTriangle}
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning-text)"
          subtitle="Items below safety limit"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Requirement Requests */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Hostel Requirement Status</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('history')}>
              View History <ArrowRight size={14} />
            </button>
          </div>

          {storeReqs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No requirements raised yet for this store.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Req No</th>
                    <th>Date</th>
                    <th>Est. Budget</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {storeReqs.map(req => (
                    <tr key={req.int_Request_Id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.txt_Request_No}</td>
                      <td>{req.dte_Request_Date}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(req.dec_Budget).toLocaleString('en-IN')}</td>
                      <td><StatusBadge status={req.txt_Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-main)' }}>
            Store Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', width: '100%' }}
              onClick={() => setCurrentTab('raise')}
            >
              <PlusCircle size={16} /> Raise Monthly Requirement
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', width: '100%' }}
              onClick={() => setCurrentTab('stock-update')}
            >
              <Package size={16} /> Receive Delivery (GRN)
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', width: '100%' }}
              onClick={() => setCurrentTab('inventory')}
            >
              <ShoppingBag size={16} /> Check Store Stock
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', width: '100%' }}
              onClick={() => setCurrentTab('history')}
            >
              <FileText size={16} /> Requirement History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
