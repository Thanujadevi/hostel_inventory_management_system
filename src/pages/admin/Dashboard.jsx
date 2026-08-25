import React from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileText, GitCompare, ShoppingBag, AlertTriangle, Building2, Truck, Package, ArrowRight, Lock, Unlock, Clock, Settings } from 'lucide-react';

export const AdminDashboard = ({ setCurrentTab }) => {
  const { requests, quotations, purchases, items, stores, suppliers, requirementPeriod, togglePeriodStatus, isRequirementWindowActive } = useData();

  const pendingRequests = requests.filter(r => r.txt_Status === 'Pending');
  const openQuotations = requests.filter(r => r.txt_Status === 'Open for Quotation');
  const activePOs = purchases.filter(p => p.txt_Status === 'Approved');
  const lowStockItems = items.filter(i => (i.int_quantity_in_hand || 0) < 15);
  const windowActive = isRequirementWindowActive();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Administrator Overview</h1>
        </div>
      </div>

      {/* Requirement Window Status Widget */}
      <div className="card" style={{ 
        marginBottom: '24px', 
        borderLeft: `5px solid ${windowActive ? 'var(--color-success)' : 'var(--color-danger)'}`,
        background: windowActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: windowActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: windowActive ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {windowActive ? <Unlock size={22} /> : <Lock size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${windowActive ? 'badge-approved' : 'badge-rejected'}`}>
                  {windowActive ? 'STORE REQUIREMENT WINDOW OPEN' : 'STORE REQUIREMENT WINDOW CLOSED'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Target: {requirementPeriod?.txt_Month || 'August'} {requirementPeriod?.int_Year || 2026}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0 0' }}>
                {requirementPeriod?.txt_Title || 'Monthly Hostel Inventory Requirement Window'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Deadline</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: windowActive ? 'var(--color-primary)' : 'var(--color-danger-text)' }}>
                {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
              </div>
            </div>

            {windowActive ? (
              <button className="btn btn-danger btn-sm" onClick={() => togglePeriodStatus('CLOSED')}>
                <Lock size={14} /> Close Now
              </button>
            ) : (
              <button className="btn btn-success btn-sm" onClick={() => togglePeriodStatus('OPEN')}>
                <Unlock size={14} /> Open Now
              </button>
            )}

            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('requirements')}>
              <Settings size={14} /> Configure Catalogue & Deadline
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <Card
          title="Pending Requirements"
          value={pendingRequests.length}
          icon={FileText}
          iconBg="var(--color-danger-bg)"
          iconColor="var(--color-danger-text)"
          subtitle="Store requests awaiting review"
        />
        <Card
          title="Active Quotations"
          value={openQuotations.length}
          icon={GitCompare}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          subtitle="Open for supplier bidding"
        />
        <Card
          title="Active Purchase Orders"
          value={activePOs.length}
          icon={ShoppingBag}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success-text)"
          subtitle="POs in delivery pipeline"
        />
        <Card
          title="Low Stock Warnings"
          value={lowStockItems.length}
          icon={AlertTriangle}
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning-text)"
          subtitle="Items below threshold (15)"
        />
      </div>

      {/* Main Grid Content */}
      <div className="admin-dashboard-layout">
        {/* Left Column: Pending Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Action Required: Pending Store Requests */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Pending Store Requirements</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Requirements raised by hostel stores waiting for admin approval
                </p>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentTab('requirements:requests')}
              >
                View All <ArrowRight size={14} />
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No pending requirements at this time.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Req No</th>
                      <th>Hostel Store</th>
                      <th>Month</th>
                      <th>Est. Budget</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.slice(0, 4).map(req => (
                      <tr key={req.int_Request_Id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.txt_Request_No}</td>
                        <td>{req.store_name}</td>
                        <td>{req.txt_Month} {req.int_Year}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(req.dec_Budget).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={req.txt_Status} /></td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setCurrentTab('requirements:requests')}
                          >
                            Review & Forward
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quotations Open for Bidding / Comparison */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Quotations Pending Comparison</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Supplier bids received and ready for side-by-side evaluation
                </p>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentTab('quotations')}
              >
                Compare Quotes <ArrowRight size={14} />
              </button>
            </div>

            {openQuotations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No requirements currently open for quotation.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Req No</th>
                      <th>Store</th>
                      <th>Items Requested</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openQuotations.slice(0, 3).map(req => (
                      <tr key={req.int_Request_Id}>
                        <td style={{ fontWeight: 600 }}>{req.txt_Request_No}</td>
                        <td>{req.store_name}</td>
                        <td>{req.items?.length || 0} Items</td>
                        <td><StatusBadge status={req.txt_Status} /></td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setCurrentTab('quotations')}
                          >
                            Compare Bids & Award PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Directory Summary & Low Stock Warnings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Metrics Card */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Platform Entities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Active Hostel Stores</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{stores.length}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={18} color="var(--color-purple-text)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Registered Suppliers</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{suppliers.length}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={18} color="var(--color-success-text)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Catalog Item Master</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{items.length}</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning-text)' }}>
              <AlertTriangle size={18} /> Low Stock Watchlist
            </h3>
            {lowStockItems.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>All items are sufficiently stocked.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockItems.map(item => (
                  <div key={item.int_Item_Id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--color-warning-bg)', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.txt_Item_Name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Category: {item.txt_Category}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>
                      {item.int_quantity_in_hand} {item.txt_Unit} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
