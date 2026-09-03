import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ShoppingBag, Truck, CheckCircle, Eye, FileText, Calendar, Building, Package } from 'lucide-react';

export const SupplierPurchaseOrders = () => {
  const { user } = useAuth();
  const { purchases, suppliers, quotations, requests, mockApi, refreshAll, showToast } = useData();
  const [selectedPO, setSelectedPO] = useState(null);

  const supplierPOs = React.useMemo(() => {
    if (!purchases || purchases.length === 0) return [];

    const currentSupplierId = Number(user?.id || user?.int_Supplier_Id || user?.supplierDetails?.int_Supplier_Id || 0);
    const matchedSupplier = (suppliers || []).find(s => 
      (currentSupplierId > 0 && Number(s.int_Supplier_Id) === currentSupplierId) ||
      (s.txt_Username && user?.username && s.txt_Username.toLowerCase() === user.username.toLowerCase()) ||
      (s.txt_Email && user?.email && s.txt_Email.toLowerCase() === user.email.toLowerCase()) ||
      (s.txt_Supplier_Name && user?.company && s.txt_Supplier_Name.toLowerCase().includes(user.company.toLowerCase())) ||
      (s.txt_Proprietor && user?.name && s.txt_Proprietor.toLowerCase().includes(user.name.toLowerCase()))
    );

    const targetSupplierId = matchedSupplier ? Number(matchedSupplier.int_Supplier_Id) : (currentSupplierId || 1);
    const targetSupplierName = (matchedSupplier?.txt_Supplier_Name || user?.company || 'Global Supplies').toLowerCase();

    return purchases.filter(p => {
      if (!p) return false;
      const pSupplierId = Number(p.int_Supplier_Id || p.int_Supplier_ID || 0);
      if (pSupplierId > 0 && targetSupplierId > 0 && pSupplierId === targetSupplierId) {
        return true;
      }
      const pSupplierName = (p.supplier_name || p.txt_Supplier_Name || '').toLowerCase();
      if (pSupplierName && targetSupplierName) {
        if (pSupplierName.includes(targetSupplierName) || targetSupplierName.includes(pSupplierName)) return true;
      }
      return true;
    });
  }, [purchases, suppliers, user]);

  const handleUpdateStatus = async (poId, status) => {
    try {
      await mockApi.updatePOStatus(poId, status);
      showToast(`PO Status updated to ${status}!`, 'success');
      if (selectedPO && (selectedPO.int_Purchase_Id === poId || selectedPO.id === poId)) {
        setSelectedPO({ ...selectedPO, txt_Status: status });
      }
      refreshAll();
    } catch (err) {
      showToast("Error updating status", "error");
    }
  };

  // Dynamically resolve PO line items
  const getPOItems = (po) => {
    if (!po) return [];
    if (po.items && Array.isArray(po.items) && po.items.length > 0) return po.items;

    // Fallback 1: Find linked quotation
    const linkedQuotation = (quotations || []).find(q => Number(q.int_Quotation_Id) === Number(po.int_Quotation_Id));
    if (linkedQuotation?.items && linkedQuotation.items.length > 0) {
      return linkedQuotation.items;
    }

    // Fallback 2: Find linked request
    const linkedReq = (requests || []).find(r => Number(r.int_Request_Id) === Number(po.int_Request_Id));
    if (linkedReq?.items && linkedReq.items.length > 0) {
      return linkedReq.items;
    }

    return [];
  };

  const columns = [
    { 
      header: 'PO Number', 
      accessor: 'txt_PO_Code', 
      render: row => (
        <button 
          className="btn-link"
          onClick={() => setSelectedPO(row)}
          style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {row.txt_PO_Code || row.po_number || `PO-${String(row.int_Purchase_Id || 1).padStart(4, '0')}`}
        </button>
      ) 
    },
    { 
      header: 'College', 
      accessor: 'college_name', 
      render: row => (
        <strong>
          National Engineering College
        </strong>
      ) 
    },
    { 
      header: 'PO Date', 
      accessor: 'dte_PO_Date',
      render: row => {
        const dStr = row.dte_PO_Date || row.dte_Created_Date || row.dte_Purchase_Date;
        return dStr ? new Date(dStr).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
      }
    },
    { 
      header: 'Total Value', 
      accessor: 'dbl_Total_Amount', 
      render: row => {
        const amount = Number(row.dbl_Total_Amount ?? row.dec_Total_Amount ?? row.dec_Final_Amount ?? row.total_amount ?? 0);
        return (
          <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>
            ₹{amount.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    { 
      header: 'Status', 
      accessor: 'txt_Status', 
      render: row => <StatusBadge status={row.txt_Status || 'PO Issued'} /> 
    },
    { 
      header: 'Dispatch Action', 
      render: row => {
        const status = row.txt_Status || 'PO Issued';
        const poId = row.int_Purchase_Id || row.id;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPO(row)} title="View Order Manifest Details">
              <Eye size={14} /> View Order
            </button>

            {status === 'PO Issued' || status === 'Approved' ? (
              <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(poId, 'Shipped / Dispatched')}>
                <Truck size={14} /> Dispatch
              </button>
            ) : status === 'Shipped / Dispatched' || status === 'Shipped' ? (
              <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={14} /> In Transit
              </span>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} color="#059669" /> Completed
              </span>
            )}
          </div>
        );
      }
    }
  ];

  const poItems = selectedPO ? getPOItems(selectedPO) : [];
  const poTotalAmount = selectedPO ? Number(selectedPO.dbl_Total_Amount ?? selectedPO.dec_Total_Amount ?? selectedPO.dec_Final_Amount ?? selectedPO.total_amount ?? 0) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Received Purchase Orders</h1>
        </div>
      </div>

      <Table columns={columns} data={supplierPOs} searchPlaceholder="Search orders..." />

      {/* PO Details Modal */}
      {selectedPO && (
        <Modal
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={`Purchase Order Details — ${selectedPO.txt_PO_Code || selectedPO.po_number || `PO-${String(selectedPO.int_Purchase_Id || 1).padStart(4, '0')}`}`}
          maxWidth="750px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusBadge status={selectedPO.txt_Status || 'PO Issued'} />
              <div style={{ display: 'flex', gap: '8px' }}>
                {(selectedPO.txt_Status === 'PO Issued' || selectedPO.txt_Status === 'Approved') && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleUpdateStatus(selectedPO.int_Purchase_Id || selectedPO.id, 'Shipped / Dispatched')}
                  >
                    <Truck size={16} /> Dispatch Shipment
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setSelectedPO(null)}>
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Details Summary */}
            <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-secondary, #f8fafc)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Institutional Recipient</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>National Engineering College</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>PO Creation Date</span>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {selectedPO.dte_PO_Date || selectedPO.dte_Created_Date ? new Date(selectedPO.dte_PO_Date || selectedPO.dte_Created_Date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Total PO Value</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-success-text)' }}>₹{poTotalAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={16} color="var(--color-primary)" /> Ordered Items & Products Manifest ({poItems.length})
              </h4>

              {poItems.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No item details registered for this PO.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Product Description</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'center' }}>Ordered Quantity</th>
                        <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                        <th style={{ textAlign: 'right' }}>Total Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((item, idx) => {
                        const qty = Number(item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 1);
                        const uPrice = Number(item.dec_Unit_Price ?? item.dbl_Unit_Price ?? item.unit_price ?? 0);
                        const totalPrice = Number(item.dec_Total_Price ?? item.dbl_Total_Price ?? (uPrice * qty) ?? 0);

                        return (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{item.product_name || item.txt_Item_Name || `Product #${item.int_Product_Id || item.int_Item_Id}`}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '10px', backgroundColor: 'var(--color-bg-secondary, #f1f5f9)' }}>
                                {item.category || item.txt_Category || 'General'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {qty} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-secondary)' }}>{item.unit || item.txt_Unit || 'Pcs'}</span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              ₹{uPrice.toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-success-text)' }}>
                              ₹{totalPrice.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
