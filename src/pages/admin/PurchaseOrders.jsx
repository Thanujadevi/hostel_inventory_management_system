import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Eye, Printer, Truck, FileCheck } from 'lucide-react';

export const AdminPurchaseOrders = () => {
  const { purchases, refreshAll, mockApi, showToast } = useData();
  const [selectedPO, setSelectedPO] = useState(null);

  const columns = [
    { 
      header: 'Order No', 
      accessor: 'po_number', 
      render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.po_number || row.txt_PO_Code || `PO-${String(row.int_Purchase_Id || 1).padStart(3, '0')}`}</strong> 
    },
    { 
      header: 'Institution', 
      accessor: 'college_name', 
      render: () => <strong style={{ color: 'var(--color-text-primary)' }}>National Engineering College</strong>
    },
    { 
      header: 'Supplier', 
      accessor: 'supplier_name', 
      render: row => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.supplier_name || row.txt_Supplier_Name || 'Supplier'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Ph: {row.supplier_phone || row.txt_Phone || '+91 98765 43210'}</div>
        </div>
      )
    },
    { 
      header: 'Order Date', 
      accessor: 'dte_Purchase_Date',
      render: row => {
        const dStr = row.dte_Purchase_Date || (row.dte_PO_Date ? String(row.dte_PO_Date).split('T')[0] : '') || (row.dte_Created_Date ? String(row.dte_Created_Date).split('T')[0] : '');
        return dStr || '2026-09-01';
      }
    },
    { 
      header: 'Total Amount', 
      accessor: 'dec_Final_Amount', 
      render: row => {
        const rawAmt = row.dec_Final_Amount !== undefined && row.dec_Final_Amount !== null ? row.dec_Final_Amount : (row.dbl_Total_Amount || 0);
        const amt = Number(rawAmt);
        return <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{isNaN(amt) ? '0' : amt.toLocaleString('en-IN')}</span>;
      }
    },
    { header: 'Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status || 'PO Issued'} /> },
    { header: 'Actions', render: row => (
      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPO(row)}>
        <Eye size={14} /> View Order
      </button>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Orders</h1>
        </div>
      </div>

      <Table columns={columns} data={purchases} searchPlaceholder="Search orders by number, store, supplier..." />

      {/* PO Detail View Modal */}
      {selectedPO && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPO(null)}
          title={`Order Details: ${selectedPO.po_number || selectedPO.txt_PO_Code || 'PO Detail'}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Institution</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>National Engineering College</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Linked Req: {selectedPO.request_no || 'REQ-001'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Supplier</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-purple-text)' }}>{selectedPO.supplier_name || selectedPO.txt_Supplier_Name || 'Supplier'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Date: {selectedPO.dte_Purchase_Date || (selectedPO.dte_PO_Date ? String(selectedPO.dte_PO_Date).split('T')[0] : '2026-09-01')}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="card" style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Items Subtotal</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{Number(selectedPO.quotation_amount || selectedPO.dec_Final_Amount || selectedPO.dbl_Total_Amount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Transport Charge</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{Number(selectedPO.transport_cost || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px', backgroundColor: 'var(--color-primary-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Grand Total</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹{Number(selectedPO.dec_Final_Amount || selectedPO.dbl_Total_Amount || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-warning-bg)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={20} color="var(--color-warning-text)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-warning-text)' }}>Delivery Status</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Expected delivery within {selectedPO.delivery_days || 3} days</div>
                </div>
              </div>
              <StatusBadge status={selectedPO.txt_Status || 'PO Issued'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedPO(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
