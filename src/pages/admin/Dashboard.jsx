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

      {/* Main Grid Content - Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Card 1: Hostel Stores Overview */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '10px' }}>
                <Building2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Hostel Stores Directory</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Campus hostel inventory stores</p>
              </div>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stores.length}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            All registered campus stores submit monthly inventory requirement indents and receive stock deliveries.
          </p>
        </div>

        {/* Card 2: Registered Suppliers Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-purple-text, #7c3aed)', borderRadius: '10px' }}>
                <Truck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Approved Suppliers</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Commercial vendor directory</p>
              </div>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-purple-text, #7c3aed)' }}>{suppliers.length}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Empaneled vendors receive competitive unit price quotation invitations and submit bidding rates.
          </p>
        </div>

        {/* Card 3: Master Inventory Catalog */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: '10px' }}>
                <Package size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Master Item Catalog</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Standardized inventory items</p>
              </div>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success-text)' }}>{items.length}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Catalog containing authorized furniture, electricals, and maintenance items with standard unit rates.
          </p>
        </div>

        {/* Card 4: Low Stock Inventory Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', borderRadius: '10px' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Low Stock Warnings</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Items below threshold (&lt;15)</p>
              </div>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-warning-text)' }}>{lowStockItems.length}</span>
          </div>

          {lowStockItems.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>All catalog items are currently well stocked.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lowStockItems.slice(0, 3).map(item => {
                const qty = (typeof item.int_quantity_in_hand === 'number') ? item.int_quantity_in_hand : (item.int_Stock || 0);
                return (
                  <div key={item.int_Item_Id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '6px', fontSize: '0.825rem' }}>
                    <span style={{ fontWeight: 600 }}>{item.txt_Item_Name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-warning-text)' }}>{qty} in hand</span>
                  </div>
                );
              })}
            </div>
          )}
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
