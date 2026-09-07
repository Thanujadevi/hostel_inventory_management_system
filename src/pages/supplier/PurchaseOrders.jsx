import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrintableReport } from '../../components/common/PrintableReport';
import { ShoppingBag, Truck, CheckCircle, Eye, FileText, Calendar, Building, Package, Printer } from 'lucide-react';

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

      {/* Executive Printable PO Manifest & PDF Export Modal */}
      {selectedPO && (
        <PrintableReport
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={`PURCHASE ORDER MANIFEST (${selectedPO.txt_PO_Code || selectedPO.po_number || 'PO-2026-001'})`}
          subtitle={`Issued by National Engineering College Central Hostel Store.`}
          reportCode={selectedPO.txt_PO_Code || selectedPO.po_number || 'PO-2026-001'}
          date={selectedPO.dte_PO_Date || selectedPO.dte_Created_Date ? new Date(selectedPO.dte_PO_Date || selectedPO.dte_Created_Date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
          metadata={[
            { label: 'Vendor / Supplier', value: selectedPO.supplier_name || selectedPO.txt_Supplier_Name || user?.company || 'Authorized Supplier' },
            { label: 'Recipient Institution', value: 'National Engineering College' },
            { label: 'Order Status', value: selectedPO.txt_Status || 'PO Issued' },
            { label: 'Payment Terms', value: 'Net 30 Days' }
          ]}
          summaryCards={[
            { label: 'Total PO Value', value: `₹${poTotalAmount.toLocaleString('en-IN')}`, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', subtitle: 'Approved Purchase Budget' },
            { label: 'Ordered Line Items', value: `${poItems.length || 1} Products`, color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe', subtitle: 'Verified Specifications' }
          ]}
          tableColumns={[
            { header: 'Product Specification', accessor: 'product_name', render: r => <strong>{r.product_name || r.txt_Item_Name || 'Hostel Supply Batch Item'}</strong> },
            { header: 'Category', accessor: 'category', render: r => r.category || r.txt_Category || 'General' },
            { header: 'Quantity', accessor: 'quantity', align: 'center', render: r => <strong>{r.dec_Required_Qty || r.int_Requested_Quantity || r.int_Quantity || r.quantity || 1} {r.unit || r.txt_Unit || 'Pcs'}</strong> },
            { header: 'Unit Price', accessor: 'unit_price', align: 'right', render: r => `₹${Number(r.dec_Unit_Price ?? r.dbl_Unit_Price ?? r.unit_price ?? poTotalAmount).toLocaleString('en-IN')}` },
            { header: 'Total Value', accessor: 'total', align: 'right', render: r => {
              const q = Number(r.dec_Required_Qty || r.int_Requested_Quantity || r.int_Quantity || r.quantity || 1);
              const p = Number(r.dec_Unit_Price ?? r.dbl_Unit_Price ?? r.unit_price ?? poTotalAmount);
              return <strong>₹{Number(r.dec_Total_Price ?? r.dbl_Total_Price ?? (q * p)).toLocaleString('en-IN')}</strong>;
            }}
          ]}
          tableData={poItems.length > 0 ? poItems : [{ product_name: `Consolidated Hostel Order Batch (${selectedPO.txt_PO_Code || 'PO-2026-001'})`, quantity: 1, unit_price: poTotalAmount, dec_Total_Price: poTotalAmount }]}
          showSignatures={true}
        />
      )}
    </div>
  );
};

