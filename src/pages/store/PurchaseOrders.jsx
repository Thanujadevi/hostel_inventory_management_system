import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Truck, CheckSquare } from 'lucide-react';

export const StorePurchaseOrders = ({ setCurrentTab }) => {
  const { currentStore } = useAuth();
  const { purchases } = useData();

  const storeId = currentStore?.id;
  const storePOs = storeId ? purchases.filter(p => p.int_Store_Id === storeId) : [];

  const columns = [
    { header: 'PO Number', accessor: 'po_number', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.po_number || row.txt_PO_Code || `PO-${String(row.int_Purchase_Id || 1).padStart(3, '0')}`}</strong> },
    { header: 'Institution', render: () => <strong>National Engineering College</strong> },
    { header: 'Linked Requirement', accessor: 'request_no', render: row => row.request_no || (row.int_Request_Id ? `REQ-${row.int_Request_Id}` : 'REQ-N/A') },
    { header: 'Supplier', accessor: 'supplier_name', render: row => <strong style={{ color: 'var(--color-purple-text)' }}>{row.supplier_name || row.txt_Supplier_Name || 'Supplier'}</strong> },
    { header: 'PO Date', accessor: 'dte_Purchase_Date', render: row => row.dte_Purchase_Date || (row.dte_PO_Date ? String(row.dte_PO_Date).split('T')[0] : '') || (row.dte_Created_Date ? String(row.dte_Created_Date).split('T')[0] : '2026-09-01') },
    { header: 'PO Total Value', accessor: 'dec_Final_Amount', render: row => {
      const amt = Number(row.dec_Final_Amount !== undefined && row.dec_Final_Amount !== null ? row.dec_Final_Amount : (row.dbl_Total_Amount || 0));
      return <span style={{ fontWeight: 700 }}>₹{isNaN(amt) ? '0' : amt.toLocaleString('en-IN')}</span>;
    }},
    { header: 'Fulfillment Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status || 'PO Issued'} /> },
    { header: 'Stock Action', render: row => (
      row.txt_Status === 'Delivered' ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-success-text)', fontWeight: 600 }}>Stock Updated</span>
      ) : (
        <button className="btn btn-success btn-sm" onClick={() => setCurrentTab('stock-update')}>
          <CheckSquare size={14} /> Confirm Receipt & Update Stock
        </button>
      )
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hostel Store Purchase Orders</h1>
        </div>
      </div>

      <Table columns={columns} data={storePOs} searchPlaceholder="Search POs by number, supplier, requirement..." />
    </div>
  );
};
