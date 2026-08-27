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
    { header: 'Order No', accessor: 'po_number', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.po_number}</strong> },
    { header: 'Hostel Store', accessor: 'store_name', render: row => <strong style={{ color: 'var(--color-text-primary)' }}>{row.store_name}</strong> },
    { header: 'Supplier', accessor: 'supplier_name', render: row => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.supplier_name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Ph: {row.supplier_phone}</div>
      </div>
    )},
    { header: 'Order Date', accessor: 'dte_Purchase_Date' },
    { header: 'Total Amount', accessor: 'dec_Final_Amount', render: row => (
      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{Number(row.dec_Final_Amount).toLocaleString('en-IN')}</span>
    )},
    { header: 'Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status} /> },
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
          title={`Order Details: ${selectedPO.po_number}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Hostel Store</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedPO.store_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Linked Req: {selectedPO.request_no}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Supplier</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-purple-text)' }}>{selectedPO.supplier_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Date: {selectedPO.dte_Purchase_Date}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="card" style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Items Subtotal</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{Number(selectedPO.quotation_amount).toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Transport Charge</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{Number(selectedPO.transport_cost).toLocaleString('en-IN')}</div>
              </div>
              <div className="card" style={{ padding: '12px 16px', backgroundColor: 'var(--color-primary-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Grand Total</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹{Number(selectedPO.dec_Final_Amount).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-warning-bg)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={20} color="var(--color-warning-text)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-warning-text)' }}>Delivery Status</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Expected delivery within {selectedPO.delivery_days} days</div>
                </div>
              </div>
              <StatusBadge status={selectedPO.txt_Status} />
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
