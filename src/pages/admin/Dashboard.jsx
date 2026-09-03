import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  FileText, GitCompare, ShoppingBag, AlertTriangle, Building2, Truck, Package, 
  ArrowRight, Lock, Unlock, Settings, Mail, Send, CheckCircle, RefreshCw, AlertCircle 
} from 'lucide-react';

export const AdminDashboard = ({ setCurrentTab }) => {
  const { requests, quotations, purchases, items, stores, suppliers, requirementPeriod, togglePeriodStatus, isRequirementWindowActive } = useData();

  const pendingRequests = requests.filter(r => {
    const status = (r.txt_Status || '').toLowerCase();
    return status === 'pending' || status === 'pending approval';
  });

  // Clear quotes that have already been processed into Purchase Orders from Open Price Quotes
  const openQuotations = requests.filter(r => {
    const status = (r.txt_Status || '').toLowerCase();
    const isProcessed = ['approved', 'po issued', 'delivered', 'completed', 'rejected'].includes(status);
    const hasPO = (purchases || []).some(p => 
      Number(p.int_Request_Id) === Number(r.int_Request_Id) ||
      String(p.request_no) === String(r.txt_Request_No || r.txt_Request_Code)
    );
    return !isProcessed && !hasPO;
  });

  const activePOs = purchases.filter(p => {
    const status = (p.txt_Status || '').toLowerCase();
    return ['po issued', 'approved', 'delivered', 'dispatched', 'shipped'].includes(status);
  });
  const lowStockItems = items.filter(i => (i.int_quantity_in_hand || 0) < 15);
  const windowActive = isRequirementWindowActive();

  // Reminder Modal & Gmail State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderStatus, setReminderStatus] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form states for Admin email credentials
  const [gmailUser, setGmailUser] = useState('24104063@nec.edu.in');
  const [gmailPass, setGmailPass] = useState('');
  const [testEmailInput, setTestEmailInput] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Dashboard banner alert
  const [dashboardAlert, setDashboardAlert] = useState(null);

  const API_BASE = 'http://localhost:5000/api/reminders';

  const safeFetchJson = async (url, options) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: `Server error (${res.status}): ${text.slice(0, 100)}` };
      }
    } catch (err) {
      return { success: false, message: `Network error: ${err.message}` };
    }
  };

  const fetchReminderStatus = async () => {
    const data = await safeFetchJson(`${API_BASE}/status`);
    if (data && data.success) {
      setReminderStatus(data);
      if (data.gmailUser && data.gmailUser !== 'Not Configured') {
        setGmailUser(data.gmailUser);
      } else {
        setGmailUser('24104063@nec.edu.in');
      }
      if (data.logs) {
        setEmailLogs(data.logs);
      }
    }
  };

  useEffect(() => {
    fetchReminderStatus();
  }, []);

  const handleOpenReminderModal = () => {
    setIsReminderModalOpen(true);
    fetchReminderStatus();
  };

  const handleTriggerRemindersNow = async (shouldOpenModal = false) => {
    setLoadingReminders(true);
    if (shouldOpenModal) {
      setIsReminderModalOpen(true);
      setNotice(null);
    } else {
      setDashboardAlert(null);
    }

    const data = await safeFetchJson(`${API_BASE}/trigger`, { method: 'POST' });
    if (data && data.success) {
      if (shouldOpenModal) {
        setNotice({ type: 'success', text: data.message });
      } else {
        setDashboardAlert({ type: 'success', text: data.message });
      }
    } else {
      const errText = data?.message || 'Failed to dispatch email reminders.';
      if (shouldOpenModal) {
        setNotice({ type: 'error', text: errText });
      } else {
        setDashboardAlert({ type: 'error', text: errText });
      }
    }
    fetchReminderStatus();
    setLoadingReminders(false);
  };

  const handleSendTestEmail = async () => {
    const target = testEmailInput || '24104063@nec.edu.in';
    setSendingTest(true);
    setNotice(null);

    const data = await safeFetchJson(`${API_BASE}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: target })
    });

    if (data && data.success) {
      setNotice({ type: 'success', text: data.message });
    } else {
      setNotice({ type: 'error', text: data?.message || 'Failed to send test email.' });
    }
    fetchReminderStatus();
    setSendingTest(false);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
            Dashboard
          </h1>
        </div>
      </div>

      {dashboardAlert && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          backgroundColor: dashboardAlert.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: dashboardAlert.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${dashboardAlert.type === 'success' ? '#86efac' : '#fca5a5'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {dashboardAlert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{dashboardAlert.text}</span>
          </div>
          <button 
            onClick={() => setDashboardAlert(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Requirement Window Status Widget & Automatic Email Reminders Bar */}
      <div className="card" style={{ 
        marginBottom: '24px', 
        borderLeft: `5px solid ${windowActive ? 'var(--color-success)' : 'var(--color-primary)'}`,
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-md)',
        padding: '20px 24px',
        borderRadius: 'var(--border-radius)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, minWidth: '320px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: windowActive ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
              color: windowActive ? 'var(--color-success-text)' : 'var(--color-info-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {windowActive ? <Unlock size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span className={`badge ${windowActive ? 'badge-approved' : 'badge-open'}`} style={{ fontWeight: 700 }}>
                  {windowActive ? 'REQUEST WINDOW OPEN' : 'REQUEST WINDOW CLOSED'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Month: {requirementPeriod?.txt_Month || 'August'} {requirementPeriod?.int_Year || 2026}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                {requirementPeriod?.txt_Title || 'Monthly Hostel Inventory Requirement Window'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ textAlign: 'right', paddingRight: '12px', borderRight: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Deadline</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: windowActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
              </div>
            </div>

            {/* Send Reminder Emails Button */}
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => handleTriggerRemindersNow(false)}
              disabled={loadingReminders}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Triggers deadline check & sends reminder emails to all active hostel store in-charges"
            >
              {loadingReminders ? <RefreshCw className="spin" size={14} /> : <Send size={14} />}
              {loadingReminders ? 'Sending Emails...' : 'Send Reminders'}
            </button>

            {/* Email Reminders Button */}
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleOpenReminderModal}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Mail size={14} /> Reminder Settings
            </button>

            {windowActive ? (
              <button className="btn btn-danger btn-sm" onClick={() => togglePeriodStatus('CLOSED')}>
                <Lock size={14} /> Close Window
              </button>
            ) : (
              <button className="btn btn-success btn-sm" onClick={() => togglePeriodStatus('OPEN')}>
                <Unlock size={14} /> Open Window
              </button>
            )}

            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('requirements')}>
              <Settings size={14} /> Item List
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <Card
          title="Pending Requests"
          value={pendingRequests.length}
          icon={FileText}
          iconBg="var(--color-danger-bg)"
          iconColor="var(--color-danger-text)"
          subtitle="Requests waiting for approval"
        />
        <Card
          title="Open Price Quotes"
          value={openQuotations.length}
          icon={GitCompare}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          subtitle="Waiting for supplier quotes"
        />
        <Card
          title="Active Orders"
          value={activePOs.length}
          icon={ShoppingBag}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success-text)"
          subtitle="Orders currently in delivery"
        />
        <Card
          title="Low Stock Alerts"
          value={lowStockItems.length}
          icon={AlertTriangle}
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning-text)"
          subtitle="Items running low (under 15)"
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Pending Hostel Requests</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Requests submitted by hostels waiting for your approval
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
                No pending requests at this time.
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
                            Review Request
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Quotes Ready to Compare</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Supplier quotes received and ready for comparison
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
                No quotes currently open for evaluation.
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
                            Compare Quotes & Order
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
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>System Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Hostel Stores</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{stores.length}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={18} color="var(--color-purple-text)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Suppliers</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{suppliers.length}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={18} color="var(--color-success-text)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Master Item List</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{items.length}</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning-text)' }}>
              <AlertTriangle size={18} /> Items Running Low
            </h3>
            {lowStockItems.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>All items are sufficiently stocked.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockItems.map(item => {
                  const qty = (typeof item.int_quantity_in_hand === 'number') ? item.int_quantity_in_hand : (item.int_Stock || 0);
                  const catName = item.txt_Category && item.txt_Category !== '--' 
                    ? item.txt_Category 
                    : (item.txt_Item_Code === 'ITM-003' ? 'Furniture & Fittings' : item.txt_Item_Code === 'ITM-002' ? 'Electrical Items' : 'Cleaning Supplies');
                  return (
                    <div key={item.int_Item_Id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.txt_Item_Name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Category: {catName}</div>
                      </div>
                      <span className="badge badge-pending" style={{ fontWeight: 700, fontSize: '0.8rem', padding: '4px 10px' }}>
                        {qty} {item.txt_Unit || 'Pcs'} left
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gmail & Automated 24-Hour Reminder Configuration Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="⏰ Email Reminder Settings"
        maxWidth="750px"
      >
        {notice && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: notice.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: notice.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${notice.type === 'success' ? '#86efac' : '#fca5a5'}`
          }}>
            {notice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Admin Sender Info Banner */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '14px 18px', 
          borderRadius: '8px', 
          background: 'var(--color-surface-hover)', 
          border: '1px solid var(--color-border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Official Admin Sender Email:</span>
            <strong style={{ fontSize: '0.925rem', color: 'var(--color-text-primary)' }}>24104063@nec.edu.in</strong>
          </div>
          <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
            Official Sender Active
          </span>
        </div>

        {/* Quick Actions & Test Email */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <input 
              type="email" 
              className="form-control" 
              placeholder="Send test email to..." 
              value={testEmailInput}
              onChange={(e) => setTestEmailInput(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleSendTestEmail} disabled={sendingTest}>
              {sendingTest ? 'Sending Test...' : 'Send Test Email'}
            </button>
          </div>

          <button 
            className="btn btn-success" 
            onClick={() => handleTriggerRemindersNow(true)} 
            disabled={loadingReminders}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loadingReminders ? <RefreshCw className="spin" size={16} /> : <Send size={16} />}
            Trigger Reminders To All Stores Now
          </button>
        </div>

        {/* Recent Email Dispatch History */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>Recent Email Reminder Logs</h4>
          <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Store / Recipient</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Trigger</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.filter(l => l.txt_Trigger_Type !== 'OTP_AUTH').length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '16px' }}>
                      No deadline reminder email logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  emailLogs.filter(l => l.txt_Trigger_Type !== 'OTP_AUTH').map(log => {
                    const triggerLabel = log.txt_Trigger_Type === '24h_SCHEDULER' 
                      ? 'Automated 24h Scheduler' 
                      : log.txt_Trigger_Type === 'MANUAL_DASHBOARD' 
                      ? 'Manual Dashboard Trigger' 
                      : log.txt_Trigger_Type === 'TEST' 
                      ? 'Test Email Dispatch' 
                      : log.txt_Trigger_Type;

                    return (
                      <tr key={log.int_Log_Id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                          {new Date(log.dte_Sent_At).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.txt_Store_Name || log.txt_Recipient_Name}</td>
                        <td>{log.txt_Recipient_Email}</td>
                        <td>
                          <span className={`badge ${log.txt_Status === 'SENT' ? 'badge-approved' : 'badge-pending'}`}>
                            {log.txt_Status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          {triggerLabel}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
