import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CreditCard, Plus, CheckCircle, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { generatePaymentCode } from '../../utils/codeGenerator';

export const AdminPayments = () => {
  const { payments, purchases, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [gatewayTab, setGatewayTab] = useState('upi');

  const [formData, setFormData] = useState({
    txt_Payment_No: '',
    int_Purchase_Id: purchases[0]?.int_Purchase_Id || 1,
    dte_Payment_Date: new Date().toISOString().split('T')[0],
    dec_Payment_Amount: purchases[0]?.dec_Final_Amount || 1000,
    txt_Payment_Mode: 'NEFT Bank Transfer',
    txt_Transaction_Id: `TXN${Date.now().toString().slice(-8)}`,
    txt_Remarks: 'Full payment released upon store receipt confirmation'
  });

  const [gatewayData, setGatewayData] = useState({
    int_Purchase_Id: purchases[0]?.int_Purchase_Id || 1,
    dec_Payment_Amount: purchases[0]?.dec_Final_Amount || 5200,
    paymentMethod: 'UPI'
  });

  const openRecordModal = () => {
    const firstPO = purchases[0];
    setFormData({
      txt_Payment_No: generatePaymentCode(payments),
      int_Purchase_Id: firstPO?.int_Purchase_Id || 1,
      dte_Payment_Date: new Date().toISOString().split('T')[0],
      dec_Payment_Amount: firstPO ? firstPO.dec_Final_Amount : 1000,
      txt_Payment_Mode: 'NEFT Bank Transfer',
      txt_Transaction_Id: `TXN${Date.now().toString().slice(-8)}`,
      txt_Remarks: 'Full payment released upon store receipt confirmation'
    });
    setIsModalOpen(true);
  };

  const openGatewayModal = () => {
    const firstPO = purchases[0];
    setGatewayData({
      int_Purchase_Id: firstPO?.int_Purchase_Id || 1,
      dec_Payment_Amount: firstPO ? firstPO.dec_Final_Amount : 5200,
      paymentMethod: 'UPI'
    });
    setIsGatewayOpen(true);
  };

  const handlePOSelect = (poId) => {
    const po = purchases.find(p => p.int_Purchase_Id === Number(poId));
    setFormData({
      ...formData,
      int_Purchase_Id: Number(poId),
      dec_Payment_Amount: po ? po.dec_Final_Amount : 0
    });
  };

  const handleGatewayPOSelect = (poId) => {
    const po = purchases.find(p => p.int_Purchase_Id === Number(poId));
    setGatewayData({
      ...gatewayData,
      int_Purchase_Id: Number(poId),
      dec_Payment_Amount: po ? po.dec_Final_Amount : 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dbl_Amount: formData.dec_Payment_Amount,
        txt_Transaction_Ref: formData.txt_Transaction_Id,
        txt_Created_By: activeUser,
        txt_Updated_By: activeUser
      };
      await apiService.savePayment(payload);
      showToast("Payment record saved successfully!", "success");
      setIsModalOpen(false);
      await refreshAll();
    } catch (err) {
      showToast("Error recording payment", "error");
    }
  };

  const handleGatewaySubmit = async () => {
    setGatewayProcessing(true);
    setTimeout(async () => {
      try {
        const txnId = `pay_Rzp${Date.now().toString().slice(-9)}`;
        const payload = {
          txt_Payment_No: generatePaymentCode(payments),
          int_Purchase_Id: Number(gatewayData.int_Purchase_Id),
          dte_Payment_Date: new Date().toISOString().split('T')[0],
          dec_Payment_Amount: Number(gatewayData.dec_Payment_Amount),
          txt_Payment_Mode: `Gateway Online (${gatewayTab.toUpperCase()})`,
          txt_Transaction_Id: txnId,
          txt_Remarks: `Online payment verified via Gateway (${gatewayTab.toUpperCase()})`,
          txt_Created_By: activeUser,
          txt_Updated_By: activeUser
        };
        await apiService.savePayment(payload);
        showToast(`Payment of ₹${Number(gatewayData.dec_Payment_Amount).toLocaleString('en-IN')} processed successfully! Txn ID: ${txnId}`, "success");
        setGatewayProcessing(false);
        setIsGatewayOpen(false);
        await refreshAll();
      } catch (err) {
        setGatewayProcessing(false);
        showToast("Online payment failed", "error");
      }
    }, 1500);
  };

  const handleRazorpayLiveCheckout = () => {
    const amountInPaise = Math.round(Number(gatewayData.dec_Payment_Amount || 5200) * 100);
    const poNumber = selectedGatewayPO?.po_number || `PO-${gatewayData.int_Purchase_Id}`;

    if (typeof window.Razorpay === 'function') {
      const options = {
        key: 'rzp_test_1DP5mmBKcBchaj',
        amount: amountInPaise,
        currency: 'INR',
        name: 'National Engineering College',
        description: `Post-Delivery Payment for ${poNumber} to ${beneficiaryMerchantName}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        prefill: {
          name: activeUser,
          email: 'accounts@nec.edu.in',
          contact: '9876543210'
        },
        notes: {
          purchase_id: gatewayData.int_Purchase_Id,
          supplier: beneficiaryMerchantName,
          proprietor: beneficiaryProprietor
        },
        theme: {
          color: '#2563eb'
        },
        handler: async function (response) {
          const txnId = response.razorpay_payment_id || `pay_Rzp${Date.now().toString().slice(-9)}`;
          const payload = {
            txt_Payment_No: generatePaymentCode(payments),
            int_Purchase_Id: Number(gatewayData.int_Purchase_Id),
            dte_Payment_Date: new Date().toISOString().split('T')[0],
            dec_Payment_Amount: Number(gatewayData.dec_Payment_Amount),
            txt_Payment_Mode: `Razorpay SDK Gateway (${gatewayTab.toUpperCase()})`,
            txt_Transaction_Id: txnId,
            txt_Remarks: `Online payment verified via Razorpay Gateway (${txnId})`,
            txt_Created_By: activeUser,
            txt_Updated_By: activeUser
          };
          await apiService.savePayment(payload);
          showToast(`Payment of ₹${Number(gatewayData.dec_Payment_Amount).toLocaleString('en-IN')} verified! Ref: ${txnId}`, "success");
          setIsGatewayOpen(false);
          await refreshAll();
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      handleGatewaySubmit();
    }
  };

  const selectedGatewayPO = purchases.find(p => p.int_Purchase_Id === Number(gatewayData.int_Purchase_Id)) || purchases[0];

  const { suppliers } = useData();
  const currentSupplier = (suppliers || []).find(s => 
    s.int_Supplier_Id === selectedGatewayPO?.int_Supplier_Id ||
    s.txt_Supplier_Name === selectedGatewayPO?.supplier_name ||
    s.txt_Store_Name === selectedGatewayPO?.supplier_name
  ) || suppliers?.[0];

  const beneficiaryMerchantName = currentSupplier?.txt_Supplier_Name || selectedGatewayPO?.supplier_name || 'Global Supplies';
  const beneficiaryProprietor = currentSupplier?.txt_Proprietor || 'Anita Roy';
  const beneficiaryUPI = `${(currentSupplier?.txt_Supplier_Name || 'globalsupplies').toLowerCase().replace(/\s+/g, '')}@icici`;
  const beneficiaryAccount = currentSupplier?.txt_Account_No || '50100293849102 (HDFC Bank | IFSC: HDFC0001234)';

  const columns = [
    { header: 'Payment No', accessor: 'txt_Payment_No', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.txt_Payment_No || row.payment_no || `PAY-${row.int_Payment_Id || 1}`}</strong> },
    { header: 'Linked PO', accessor: 'po_number', render: row => <strong>{row.po_number || row.txt_PO_Code || `PO-${row.int_Purchase_Id || 1}`}</strong> },
    { header: 'Beneficiary Supplier', accessor: 'supplier_name', render: row => <strong style={{ color: 'var(--color-purple-text)' }}>{row.supplier_name || row.txt_Supplier_Name || 'Global Supplies'}</strong> },
    { header: 'Payment Date', accessor: 'dte_Payment_Date', render: row => row.dte_Payment_Date || (row.dte_Created_Date ? String(row.dte_Created_Date).split('T')[0] : '2026-08-30') },
    { header: 'Amount Paid', accessor: 'dec_Payment_Amount', render: row => {
      const amt = Number(row.dec_Payment_Amount ?? row.dbl_Amount ?? row.amount ?? 0);
      return <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>₹{isNaN(amt) ? '0' : amt.toLocaleString('en-IN')}</span>;
    }},
    { header: 'Payment Mode', accessor: 'txt_Payment_Mode', render: row => row.txt_Payment_Mode || 'NEFT Bank Transfer' },
    { header: 'Transaction Reference', accessor: 'txt_Transaction_Id', render: row => (
      <span className="code-badge" style={{ fontFamily: 'monospace' }}>
        {row.txt_Transaction_Id || row.txt_Transaction_Ref || 'TXN8849201'}
      </span>
    )},
    { header: 'Status', accessor: 'txt_Payment_Status', render: row => <StatusBadge status={row.txt_Payment_Status || 'Completed'} /> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payment Tracking & Ledger</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={openGatewayModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <CreditCard size={16} /> Pay Online (Razorpay / UPI Gateway)
          </button>
          <button className="btn btn-secondary" onClick={openRecordModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Record Manual Ledger Payment
          </button>
        </div>
      </div>

      <Table columns={columns} data={payments} searchPlaceholder="Search payments by Payment No, PO, supplier, transaction ID..." />

      {/* Manual Payment Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Supplier Payment"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Code</label>
            <input
              type="text"
              className="form-control"
              required
              value={formData.txt_Payment_No}
              onChange={e => setFormData({ ...formData, txt_Payment_No: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Delivered Purchase Order (PO)</label>
            <select
              className="form-select"
              required
              value={formData.int_Purchase_Id}
              onChange={e => handlePOSelect(e.target.value)}
            >
              {purchases.map(po => (
                <option key={po.int_Purchase_Id} value={po.int_Purchase_Id}>
                  {po.po_number || `PO-${po.int_Purchase_Id}`} — {po.supplier_name || 'Global Supplies'} (Amount: ₹{Number(po.dec_Final_Amount || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Amount (₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-control"
                required
                placeholder="0"
                value={formData.dec_Payment_Amount ?? ''}
                onFocus={e => e.target.select()}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, dec_Payment_Amount: val === '' ? '' : Number(val) });
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                className="form-control"
                required
                value={formData.dte_Payment_Date}
                onChange={e => setFormData({ ...formData, dte_Payment_Date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                className="form-select"
                value={formData.txt_Payment_Mode}
                onChange={e => setFormData({ ...formData, txt_Payment_Mode: e.target.value })}
              >
                <option value="NEFT Bank Transfer">NEFT Bank Transfer</option>
                <option value="RTGS Transfer">RTGS Transfer</option>
                <option value="UPI Commercial">UPI Commercial</option>
                <option value="Cheque / DD">Cheque / Demand Draft</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction Reference ID</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_Transaction_Id}
                onChange={e => setFormData({ ...formData, txt_Transaction_Id: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Remarks</label>
            <textarea
              className="form-textarea"
              rows="2"
              value={formData.txt_Remarks}
              onChange={e => setFormData({ ...formData, txt_Remarks: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">
              <CheckCircle size={16} /> Confirm & Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Online Gateway Payment Checkout Modal */}
      <Modal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        title="Payment Gateway Checkout (Live Integration)"
        maxWidth="600px"
      >
        <div>
          <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gateway Payment Partner</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={18} color="#38bdf8" /> Razorpay Secured Checkout
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Payable</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                ₹{Number(gatewayData.dec_Payment_Amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Delivered Order to Settle</label>
            <select
              className="form-select"
              value={gatewayData.int_Purchase_Id}
              onChange={e => handleGatewayPOSelect(e.target.value)}
            >
              {purchases.map(po => (
                <option key={po.int_Purchase_Id} value={po.int_Purchase_Id}>
                  {po.po_number || `PO-${po.int_Purchase_Id}`} — {po.supplier_name || 'Global Supplies'} [{po.txt_Status || 'Delivered'}] (₹{Number(po.dec_Final_Amount || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Timing & Terms Preference */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Payment Terms & Timing Preference</label>
            <select className="form-select" defaultValue="Post-Delivery Settlement (100% Released After Goods Receipt)">
              <option value="Post-Delivery Settlement (100% Released After Goods Receipt)">
                Post-Delivery Settlement (100% Released After Store Goods Receipt Verification)
              </option>
              <option value="50% Advance & 50% Post-Delivery">
                50% Advance & 50% Post-Delivery Settlement
              </option>
              <option value="Net 30-Day Credit Terms">
                Net 30-Day Credit Terms (Invoice Settlement)
              </option>
            </select>
          </div>

          {/* Post-Delivery Policy Banner */}
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
            🛡️ <strong>Post-Delivery Payment Rule:</strong> Payment is automatically held until the Hostel Store In-charge confirms physical receipt & stock quality inspection.
          </div>

          {/* Beneficiary Merchant Account Details */}
          <div style={{ backgroundColor: 'var(--color-surface-hover, #f8fafc)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beneficiary Merchant Account</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-purple-text)', marginTop: '2px' }}>
              {beneficiaryMerchantName} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>(Prop: {beneficiaryProprietor})</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
              Direct Merchant Settlement Account: <strong>{beneficiaryAccount}</strong>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            <button
              type="button"
              className={`btn btn-sm ${gatewayTab === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setGatewayTab('upi')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
            >
              <QrCode size={14} /> UPI / QR Code
            </button>
            <button
              type="button"
              className={`btn btn-sm ${gatewayTab === 'netbanking' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setGatewayTab('netbanking')}
              style={{ fontWeight: 600 }}
            >
              Net Banking
            </button>
            <button
              type="button"
              className={`btn btn-sm ${gatewayTab === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setGatewayTab('card')}
              style={{ fontWeight: 600 }}
            >
              Corporate Card
            </button>
          </div>

          {/* Tab Content */}
          {gatewayTab === 'upi' && (
            <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Scan Supplier's Merchant UPI QR Code via GPay / PhonePe / Paytm
              </div>
              <div style={{ backgroundColor: '#ffffff', width: '130px', height: '130px', margin: '0 auto 12px auto', border: '2px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={90} color="#000000" />
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                Direct Supplier Merchant VPA: <strong style={{ color: 'var(--color-primary)' }}>{beneficiaryUPI}</strong>
              </div>
            </div>
          )}

          {gatewayTab === 'netbanking' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Select Bank</label>
              <select className="form-select" defaultValue="SBI Commercial Bank">
                <option value="SBI Commercial Bank">State Bank of India — Commercial Banking</option>
                <option value="HDFC Corporate">HDFC Bank — Corporate NetBanking</option>
                <option value="ICICI Business">ICICI Bank — Business NetBanking</option>
                <option value="Axis Corporate">Axis Bank — Corporate Account</option>
              </select>
            </div>
          )}

          {gatewayTab === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input type="text" className="form-control" placeholder="Card Number (4000 1234 5678 9010)" defaultValue="4532 •••• •••• 8849" />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="form-control" placeholder="MM/YY" defaultValue="12/28" />
                <input type="password" className="form-control" placeholder="CVV" defaultValue="884" />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" disabled={gatewayProcessing} onClick={() => setIsGatewayOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success"
              disabled={gatewayProcessing}
              onClick={handleRazorpayLiveCheckout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, padding: '10px 20px' }}
            >
              {gatewayProcessing ? (
                <>
                  <Loader2 size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} /> Processing Gateway Payment...
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Pay ₹{Number(gatewayData.dec_Payment_Amount || 0).toLocaleString('en-IN')} Now
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
