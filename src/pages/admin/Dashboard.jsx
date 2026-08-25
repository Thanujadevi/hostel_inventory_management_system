import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  FileText, GitCompare, ShoppingBag, AlertTriangle, Building2, Truck, Package, 
  ArrowRight, Lock, Unlock, Clock, Settings, Mail, Send, CheckCircle, RefreshCw, AlertCircle 
} from 'lucide-react';

export const AdminDashboard = ({ setCurrentTab }) => {
  const { requests, quotations, purchases, items, stores, suppliers, requirementPeriod, togglePeriodStatus, isRequirementWindowActive } = useData();

  const pendingRequests = requests.filter(r => r.txt_Status === 'Pending');
  const openQuotations = requests.filter(r => r.txt_Status === 'Open for Quotation');
  const activePOs = purchases.filter(p => p.txt_Status === 'Approved');
  const lowStockItems = items.filter(i => (i.int_quantity_in_hand || 0) < 15);
  const windowActive = isRequirementWindowActive();

  // Reminder Modal & Gmail State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderStatus, setReminderStatus] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form states for Gmail credentials
  const [gmailUser, setGmailUser] = useState('');
  const [gmailPass, setGmailPass] = useState('');
  const [testEmailInput, setTestEmailInput] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Dashboard banner alert
  const [dashboardAlert, setDashboardAlert] = useState(null);

  const API_BASE = 'http://localhost:5000/api/reminders';

  const fetchReminderStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const data = await res.json();
        setReminderStatus(data);
        if (data.gmailUser && data.gmailUser !== 'Not Configured') {
          setGmailUser(data.gmailUser);
        }
        if (data.logs) {
          setEmailLogs(data.logs);
        }
      }
    } catch (e) {
      console.error('Failed to fetch reminder status:', e.message);
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

    try {
      const res = await fetch(`${API_BASE}/trigger`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (shouldOpenModal) {
          setNotice({ type: 'success', text: data.message });
        } else {
          setDashboardAlert({ type: 'success', text: data.message });
        }
      } else {
        const errText = data.message || 'Failed to dispatch email reminders.';
        if (shouldOpenModal) {
          setNotice({ type: 'error', text: errText });
        } else {
          setDashboardAlert({ type: 'error', text: errText });
        }
      }
      fetchReminderStatus();
    } catch (err) {
      const connErr = `Connection error: ${err.message}`;
      if (shouldOpenModal) {
        setNotice({ type: 'error', text: connErr });
      } else {
        setDashboardAlert({ type: 'error', text: connErr });
      }
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleSaveGmailConfig = async (e) => {
    e.preventDefault();
    if (!gmailUser || !gmailPass) {
      setNotice({ type: 'error', text: 'Please enter both Gmail address and Gmail App Password.' });
      return;
    }
    setSavingConfig(true);
    setNotice(null);
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailUser, gmailPass })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: data.message });
        fetchReminderStatus();
      } else {
        setNotice({ type: 'error', text: data.message });
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendTestEmail = async () => {
    const target = testEmailInput || gmailUser;
    if (!target) {
      setNotice({ type: 'error', text: 'Please enter an email address to send test email.' });
      return;
    }
    setSendingTest(true);
    setNotice(null);
    try {
      const res = await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: data.message });
      } else {
        setNotice({ type: 'error', text: data.message });
      }
      fetchReminderStatus();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Administrator Overview</h1>
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

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ textAlign: 'right', marginRight: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Deadline</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: windowActive ? 'var(--color-primary)' : 'var(--color-danger-text)' }}>
                {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
              </div>
            </div>

            {/* Send Reminder Emails Button */}
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => handleTriggerRemindersNow(false)}
              disabled={loadingReminders}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb', color: '#ffffff' }}
              title="Triggers deadline check & sends reminder emails to all active hostel store in-charges"
            >
              {loadingReminders ? <RefreshCw className="spin" size={14} /> : <Send size={14} />}
              {loadingReminders ? 'Sending Emails...' : 'Send Reminders Now'}
            </button>

            {/* Configure Gmail & Reminders Button */}
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleOpenReminderModal}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Mail size={14} /> Gmail & Reminders
            </button>

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
              <Settings size={14} /> Configure Catalogue
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

      {/* Gmail & Automated 24-Hour Reminder Configuration Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="⏰ Automated 24-Hour Email Reminder Engine"
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

        {/* 24-Hour Scheduler Status Banner */}
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-surface-hover)',
          border: '1px solid var(--color-border)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--color-primary)" />
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Automated Scheduler Rule</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Runs automatically every 24 hours & triggers email reminders <strong>2 days before requirement deadline</strong>.
                </div>
              </div>
            </div>
            <span className="badge badge-approved" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> 24H Cron Active
            </span>
          </div>
        </div>

        {/* Gmail SMTP Credentials Form */}
        <div style={{ marginBottom: '24px', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} /> Connect Gmail Account (SMTP)
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Provide your Gmail address and 16-character <strong>Gmail App Password</strong> (generated from Google Account &gt; Security &gt; 2-Step Verification &gt; App passwords).
          </p>

          <form onSubmit={handleSaveGmailConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Gmail Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="your.name@gmail.com" 
                value={gmailUser}
                onChange={(e) => setGmailUser(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Gmail App Password (16-char)</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="xxxx xxxx xxxx xxxx" 
                value={gmailPass}
                onChange={(e) => setGmailPass(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingConfig}>
              {savingConfig ? 'Saving...' : 'Save Credentials'}
            </button>
          </form>
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
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '16px' }}>
                      No reminder email logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  emailLogs.map(log => (
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
                      <td style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                        {log.txt_Trigger_Type}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
