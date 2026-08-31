import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CreditCard, Plus, CheckCircle } from 'lucide-react';
import { generatePaymentCode } from '../../utils/codeGenerator';

export const AdminPayments = () => {
  const { payments, purchases, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    txt_Payment_No: '',
    int_Purchase_Id: purchases[0]?.int_Purchase_Id || 1,
    dte_Payment_Date: new Date().toISOString().split('T')[0],
    dec_Payment_Amount: purchases[0]?.dec_Final_Amount || 1000,
    txt_Payment_Mode: 'NEFT Bank Transfer',
    txt_Transaction_Id: `TXN${Date.now().toString().slice(-8)}`,
    txt_Remarks: 'Full payment released upon store receipt confirmation'
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

  const handlePOSelect = (poId) => {
    const po = purchases.find(p => p.int_Purchase_Id === Number(poId));
    setFormData({
      ...formData,
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

  const columns = [
    { header: 'Payment No', accessor: 'txt_Payment_No', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.txt_Payment_No}</strong> },
    { header: 'Linked PO', accessor: 'po_number', render: row => <strong>{row.po_number}</strong> },
    { header: 'Beneficiary Supplier', accessor: 'supplier_name', render: row => <strong style={{ color: 'var(--color-purple-text)' }}>{row.supplier_name}</strong> },
    { header: 'Payment Date', accessor: 'dte_Payment_Date' },
    { header: 'Amount Paid', accessor: 'dec_Payment_Amount', render: row => (
      <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>
        ₹{Number(row.dec_Payment_Amount).toLocaleString('en-IN')}
      </span>
    )},
    { header: 'Payment Mode', accessor: 'txt_Payment_Mode' },
    { header: 'Transaction Reference', accessor: 'txt_Transaction_Id', render: row => (
      <span className="code-badge" style={{ fontFamily: 'monospace' }}>
        {row.txt_Transaction_Id}
      </span>
    )},
    { header: 'Status', accessor: 'txt_Payment_Status', render: row => <StatusBadge status={row.txt_Payment_Status} /> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payment Tracking & Ledger</h1>
        </div>
        <button className="btn btn-primary" onClick={openRecordModal}>
          <Plus size={16} /> Record New Payment
        </button>
      </div>

      <Table columns={columns} data={payments} searchPlaceholder="Search payments by Payment No, PO, supplier, transaction ID..." />

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
                  {po.po_number} — {po.supplier_name} ({po.store_name} | Amount: ₹{Number(po.dec_Final_Amount).toLocaleString('en-IN')})
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
    </div>
  );
};
