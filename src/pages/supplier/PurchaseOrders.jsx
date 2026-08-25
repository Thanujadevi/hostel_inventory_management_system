import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Truck, CheckCircle } from 'lucide-react';

export const SupplierPurchaseOrders = () => {
  const { user } = useAuth();
  const { purchases, mockApi, refreshAll, showToast } = useData();

  const supplierPOs = purchases.filter(p => p.supplier_name === (user?.company || 'Apex Commercial Traders'));

  const handleUpdateStatus = async (poId, status) => {
    try {
      await mockApi.updatePOStatus(poId, status);
      showToast(`PO Status updated to ${status}!`, 'success');
      refreshAll();
    } catch (err) {
      showToast("Error updating status", "error");
    }
  };

  const columns = [
    { header: 'PO Number', accessor: 'po_number', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.po_number}</strong> },
    { header: 'College', accessor: 'store_name', render: row => <strong>{row.store_name}</strong> },
    { header: 'PO Date', accessor: 'dte_Purchase_Date' },
    { header: 'Total Value', accessor: 'dec_Final_Amount', render: row => <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>₹{Number(row.dec_Final_Amount).toLocaleString('en-IN')}</span> },
    { header: 'Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status} /> },
    { header: 'Dispatch Action', render: row => (
      row.txt_Status === 'Approved' ? (
        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(row.int_Purchase_Id, 'Shipped / Dispatched')}>
          <Truck size={14} /> Dispatch Shipment
        </button>
      ) : (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Fulfillment In Progress</span>
      )
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Received Purchase Orders</h1>
        </div>
      </div>

      <Table columns={columns} data={supplierPOs.length ? supplierPOs : purchases} searchPlaceholder="Search orders..." />
    </div>
  );
};
