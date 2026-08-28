import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Eye, History } from 'lucide-react';

export const StoreRequirementHistory = () => {
  const { currentStore } = useAuth();
  const { requests, items } = useData();
  const [selectedReq, setSelectedReq] = useState(null);

  const storeId = currentStore?.id;
  const storeReqs = storeId ? requests.filter(r => String(r.int_Store_Id) === String(storeId)) : requests;

  const columns = [
    { header: 'Req No', accessor: 'txt_Request_No', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.txt_Request_No || row.txt_Request_Code || `REQ-${row.int_Request_Id}`}</strong> },
    { header: 'Request Date', accessor: 'dte_Request_Date', render: row => row.dte_Request_Date ? new Date(row.dte_Request_Date).toISOString().split('T')[0] : 'Today' },
    { header: 'Month / Year', accessor: 'txt_Month', render: row => `${row.txt_Month || 'August'} ${row.int_Year || 2026}` },
    { header: 'Est. Budget', accessor: 'dec_Budget', render: row => {
      const savedBudget = Number(row.dec_Budget || row.dbl_Total_Budget || 0);
      const calcBudget = (row.items || []).reduce((sum, i) => {
        const qty = Number(i.dec_Required_Qty !== undefined && i.dec_Required_Qty !== null ? i.dec_Required_Qty : (i.int_Quantity !== undefined ? i.int_Quantity : (i.int_Requested_Quantity || i.quantity || 1)));
        const prodId = Number(i.int_Product_Id ?? i.int_Item_Id);
        const masterItem = (Array.isArray(items) ? items : []).find(m => Number(m.int_Item_Id) === prodId);
        const price = Number(i.dec_Last_Purchase_Price ?? i.dbl_Unit_Price ?? masterItem?.dec_Last_Purchase_Price ?? masterItem?.dbl_Unit_Price ?? 100);
        return sum + (qty * price);
      }, 0);
      const finalBudget = savedBudget > 0 ? savedBudget : calcBudget;
      return <span style={{ fontWeight: 700 }}>₹{finalBudget.toLocaleString('en-IN')}</span>;
    }},
    { header: 'Items Count', accessor: 'items', render: row => `${row.items?.length || 0} Items` },
    { header: 'Current Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status || 'Pending'} /> },
    { header: 'Action', render: row => (
      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReq(row)}>
        <Eye size={14} /> View Manifest
      </button>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Requirement History & Status Tracking</h1>
        </div>
      </div>

      <Table columns={columns} data={storeReqs} searchPlaceholder="Search by requirement number, date, month, status..." />

      {/* Manifest Modal */}
      {selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReq(null)}
          title={`Requirement Manifest: ${selectedReq.txt_Request_No || selectedReq.txt_Request_Code || `REQ-${selectedReq.int_Request_Id}`}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-hover)', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Status Timeline</span>
                <div><StatusBadge status={selectedReq.txt_Status || 'Pending'} /></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Budget</span>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  ₹{(Number(selectedReq.dec_Budget || selectedReq.dbl_Total_Budget || 0) > 0 ? Number(selectedReq.dec_Budget || selectedReq.dbl_Total_Budget) : (selectedReq.items || []).reduce((sum, i) => {
                    const qty = Number(i.dec_Required_Qty !== undefined && i.dec_Required_Qty !== null ? i.dec_Required_Qty : (i.int_Quantity !== undefined ? i.int_Quantity : (i.int_Requested_Quantity || i.quantity || 1)));
                    const prodId = Number(i.int_Product_Id ?? i.int_Item_Id);
                    const masterItem = (Array.isArray(items) ? items : []).find(m => Number(m.int_Item_Id) === prodId);
                    const price = Number(i.dec_Last_Purchase_Price ?? i.dbl_Unit_Price ?? masterItem?.dec_Last_Purchase_Price ?? masterItem?.dbl_Unit_Price ?? 100);
                    return sum + (qty * price);
                  }, 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Product Description</th>
                    <th>Category</th>
                    <th>Required Qty</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReq.items || []).map((item, idx) => {
                    const itemCode = item.product_code || item.txt_Item_Code || `PRD-00${item.int_Product_Id || item.int_Item_Id || idx + 1}`;
                    const itemName = item.product_name || item.txt_Item_Name || `Product #${item.int_Item_Id || idx + 1}`;
                    const cat = item.category || item.txt_Category || 'General';
                    const brandName = item.brand || item.txt_Brand || '';
                    const qtyVal = item.dec_Required_Qty || item.int_Requested_Quantity || item.quantity || 0;
                    const unitVal = item.unit || item.txt_Unit_Of_Measurement || item.txt_Unit || 'Pcs';
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{itemCode}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{itemName}</div>
                          {brandName && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Brand: {brandName}</div>}
                        </td>
                        <td>
                          <span className="category-badge">
                            {cat}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{qtyVal} {unitVal}</td>
                        <td style={{ fontSize: '0.85rem' }}>{item.txt_Remarks || item.txt_Reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReq(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
