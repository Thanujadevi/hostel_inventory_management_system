import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Eye, History } from 'lucide-react';

export const StoreRequirementHistory = () => {
  const { currentStore } = useAuth();
  const { requests } = useData();
  const [selectedReq, setSelectedReq] = useState(null);

  const storeId = currentStore?.id;
  const storeReqs = storeId ? requests.filter(r => r.int_Store_Id === storeId) : [];

  const columns = [
    { header: 'Req No', accessor: 'txt_Request_No', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.txt_Request_No}</strong> },
    { header: 'Request Date', accessor: 'dte_Request_Date' },
    { header: 'Month / Year', accessor: 'txt_Month', render: row => `${row.txt_Month} ${row.int_Year}` },
    { header: 'Est. Budget', accessor: 'dec_Budget', render: row => <span style={{ fontWeight: 700 }}>₹{Number(row.dec_Budget).toLocaleString('en-IN')}</span> },
    { header: 'Items Count', accessor: 'items', render: row => `${row.items?.length || 0} Items` },
    { header: 'Current Status', accessor: 'txt_Status', render: row => <StatusBadge status={row.txt_Status} /> },
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
          title={`Requirement Manifest: ${selectedReq.txt_Request_No}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-hover)', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Status Timeline</span>
                <div><StatusBadge status={selectedReq.txt_Status} /></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Budget</span>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{Number(selectedReq.dec_Budget).toLocaleString('en-IN')}</div>
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
                  {selectedReq.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.product_code || `PRD-00${item.int_Product_Id}`}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.product_name}</div>
                        {item.brand && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Brand: {item.brand}</div>}
                      </td>
                      <td>
                        <span className="category-badge">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.dec_Required_Qty} {item.unit}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.txt_Remarks || '—'}</td>
                    </tr>
                  ))}
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
