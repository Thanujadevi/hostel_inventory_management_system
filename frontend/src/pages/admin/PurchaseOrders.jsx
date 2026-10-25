import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrintableReport } from '../../components/common/PrintableReport';
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
        <Eye size={14} /> View / Print Order
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

      {/* Official PO Detail View & PDF Export Modal */}
      {selectedPO && (
        <PrintableReport
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={`OFFICIAL PURCHASE ORDER (${selectedPO.po_number || selectedPO.txt_PO_Code || 'PO-2026-001'})`}
          subtitle={`Issued to vendor ${selectedPO.supplier_name || selectedPO.txt_Supplier_Name || 'Authorized Supplier'} for central hostel inventory supply.`}
          reportCode={selectedPO.po_number || selectedPO.txt_PO_Code || 'PO-2026-001'}
          date={selectedPO.dte_Purchase_Date || (selectedPO.dte_PO_Date ? String(selectedPO.dte_PO_Date).split('T')[0] : '2026-09-01')}
          metadata={[
            { label: 'Vendor / Supplier', value: selectedPO.supplier_name || selectedPO.txt_Supplier_Name || 'Authorized Supplier' },
            { label: 'Linked Requirement', value: selectedPO.request_no || selectedPO.txt_Request_No || 'REQ-2026-001' },
            { label: 'Expected Delivery', value: `Within ${selectedPO.delivery_days || 3} Days` },
            { label: 'Order Status', value: selectedPO.txt_Status || 'PO Issued' }
          ]}
          summaryCards={[
            { label: 'Items Subtotal', value: `₹${Number(selectedPO.quotation_amount || selectedPO.dec_Final_Amount || selectedPO.dbl_Total_Amount || 0).toLocaleString('en-IN')}`, color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Transport Charge', value: `₹${Number(selectedPO.transport_cost || 0).toLocaleString('en-IN')}`, color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
            { label: 'Grand Total Amount', value: `₹${Number(selectedPO.dec_Final_Amount || selectedPO.dbl_Total_Amount || 0).toLocaleString('en-IN')}`, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' }
          ]}
          tableColumns={[
            { header: 'Order Specification / Item', accessor: 'item_name', render: r => <strong>{r.item_name || selectedPO.po_number || 'Inventory Catalog Batch Items'}</strong> },
            { header: 'Unit Price', accessor: 'unit_price', align: 'right', render: r => `₹${Number(r.unit_price || selectedPO.dec_Final_Amount || 0).toLocaleString('en-IN')}` },
            { header: 'Order Amount', accessor: 'total', align: 'right', render: () => <strong>₹{Number(selectedPO.dec_Final_Amount || selectedPO.dbl_Total_Amount || 0).toLocaleString('en-IN')}</strong> }
          ]}
          tableData={[{ item_name: `Consolidated Hostel Stock Order Batch (${selectedPO.po_number || 'PO-2026-001'})`, unit_price: selectedPO.dec_Final_Amount }]}
          showSignatures={true}
        />
      )}
    </div>
  );
};
