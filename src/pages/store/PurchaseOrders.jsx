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
    { header: 'PO Number', accessor: 'po_number', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.po_number}</strong> },
    { header: 'Linked Requirement', accessor: 'request_no' },
    { header: 'Supplier', accessor: 'supplier_name', render: row => <strong style={{ color: 'var(--color-purple-text)' }}>{row.supplier_name}</strong> },
    { header: 'PO Date', accessor: 'dte_Purchase_Date' },
    { header: 'PO Total Value', accessor: 'dec_Final_Amount', render: row => <span style={{ fontWeight: 700 }}>₹{Number(row.dec_Final_Amount).toLocaleString('en-IN')}</span> },
    { header: 'Fulfillment Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status} /> },
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
