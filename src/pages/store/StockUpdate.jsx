import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckSquare, PackageCheck, AlertCircle, ArrowRight, Star } from 'lucide-react';

export const StoreStockUpdate = ({ setCurrentTab }) => {
  const { currentStore } = useAuth();
  const { purchases, requests, getStoreItems, mockApi, showToast, refreshAll } = useData();

  const storeId = currentStore?.id;
  // Get POs for this store that are Approved or Delivered
  const storePOs = storeId ? purchases.filter(p => p.int_Store_Id === storeId) : [];

  const [selectedPOId, setSelectedPOId] = useState(storePOs[0]?.int_Purchase_Id || '');
  const [receiptRemarks, setReceiptRemarks] = useState('');
  const [supplierRating, setSupplierRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const storeItems = getStoreItems(storeId);
  const currentPO = storePOs.find(p => p.int_Purchase_Id === Number(selectedPOId));

  // Find linked requirement and items
  const linkedReq = requests.find(r => r.txt_Request_No === currentPO?.request_no);
  
  // Received quantities map: { product_id: qty }
  const [receivedMap, setReceivedMap] = useState({});

  const handleQtyChange = (productId, qty) => {
    setReceivedMap(prev => ({
      ...prev,
      [productId]: Number(qty)
    }));
  };

  const { user } = useAuth();
  const activeUser = user?.name || user?.username || currentStore?.name || 'Store In-Charge';

  const handleConfirmDelivery = async () => {
    if (!currentPO) return;
    
    // Construct default map if empty
    const finalMap = { ...receivedMap };
    if (linkedReq?.items) {
      linkedReq.items.forEach(item => {
        const pId = item.int_Product_Id || item.int_Item_Id;
        const qty = Number(item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 0);
        if (finalMap[pId] === undefined) {
          finalMap[pId] = qty;
        }
      });
    }

    try {
      // Update each delivered item's current stock level in MySQL DB
      if (linkedReq?.items) {
        for (const item of linkedReq.items) {
          const pId = item.int_Product_Id || item.int_Item_Id;
          const defaultQty = Number(item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 0);
          const recQty = Number(finalMap[pId] !== undefined ? finalMap[pId] : defaultQty);
          const catalogItem = storeItems.find(i => Number(i.int_Item_Id) === Number(pId));
          const currentStock = Number(catalogItem?.int_Current_Stock || catalogItem?.int_quantity_in_hand || 0);
          const newStock = currentStock + recQty;

          if (pId) {
            await apiService.saveItem({
              int_Item_Id: pId,
              int_Current_Stock: newStock,
              int_quantity_in_hand: newStock,
              txt_Updated_By: activeUser
            });
          }
        }
      }

      await mockApi.receiveStoreDelivery(currentPO.int_Purchase_Id, finalMap, receiptRemarks || 'Physical stock verified by store in-charge');
      if (currentPO.supplier_name && supplierRating > 0 && mockApi.rateSupplier) {
        await mockApi.rateSupplier(currentPO.supplier_name, supplierRating);
      }
      showToast(`Stock successfully verified & updated in ${currentStore?.name || 'Store'} inventory!`, 'success');
      await refreshAll();
      setCurrentTab('inventory');
    } catch (err) {
      console.error("Error updating stock:", err);
      showToast("Error updating stock quantity", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Delivery Verification & Stock Update</h1>
        </div>
      </div>

      {/* Select PO Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 600 }}>
            Select Purchase Order to Receive:
          </label>
          <select
            className="form-select"
            style={{ maxWidth: '500px' }}
            value={selectedPOId}
            onChange={e => setSelectedPOId(Number(e.target.value))}
          >
            {storePOs.length === 0 ? (
              <option value="">No purchase orders available</option>
            ) : (
              storePOs.map(po => (
                <option key={po.int_Purchase_Id} value={po.int_Purchase_Id}>
                  {po.po_number} — Supplier: {po.supplier_name} (PO Date: {po.dte_Purchase_Date} | Status: {po.txt_Status})
                </option>
              ))
            )}
          </select>
          {currentPO && <StatusBadge status={currentPO.txt_Status} />}
        </div>
      </div>

      {!currentPO ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No purchase orders found for stock update.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Manifest Table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Material Delivery Manifest: {currentPO.po_number}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Verify delivered quantities against ordered specifications from {currentPO.supplier_name}
                </p>
              </div>
              {currentPO.txt_Status === 'Delivered' && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-success-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PackageCheck size={18} /> Delivery Previously Confirmed
                </span>
              )}
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Ordered Quantity</th>
                    <th>Physical Received Qty</th>
                    <th>Stock Action</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedReq?.items?.map((item, idx) => {
                    const pId = item.int_Product_Id || item.int_Item_Id;
                    const catalogItem = storeItems.find(i => Number(i.int_Item_Id) === Number(pId));
                    const currentStock = catalogItem?.int_quantity_in_hand || catalogItem?.int_Current_Stock || 0;
                    const defaultQty = Number(item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 0);
                    const recQty = receivedMap[pId] !== undefined 
                      ? receivedMap[pId] 
                      : defaultQty;
                    const unitName = item.unit || item.txt_Unit || 'Pcs';

                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product_name || item.txt_Item_Name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Current In-Hand: {currentStock} {unitName}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {defaultQty} {unitName}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="form-control"
                            style={{ width: '120px', fontWeight: 700, color: 'var(--color-primary)' }}
                            disabled={currentPO.txt_Status === 'Delivered'}
                            value={recQty}
                            onChange={e => handleQtyChange(item.int_Product_Id, e.target.value)}
                          />
                        </td>
                        <td>
                          <span style={{ fontSize: '0.825rem', color: 'var(--color-success-text)', fontWeight: 600 }}>
                            New Stock Level: {currentStock + Number(recQty)} {item.unit}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px' }} className="form-group">
              <label className="form-label">Store In-Charge Verification Remarks</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. All 50 packages received in intact condition, sealed with invoice"
                disabled={currentPO.txt_Status === 'Delivered'}
                value={receiptRemarks}
                onChange={e => setReceiptRemarks(e.target.value)}
              />
            </div>

            {currentPO.txt_Status !== 'Delivered' && (
              <div style={{ 
                marginTop: '16px', 
                padding: '14px 18px', 
                backgroundColor: 'var(--color-surface-hover)', 
                borderRadius: '8px', 
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Rate Supplier Performance ({currentPO.supplier_name})
                  </label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    How satisfied are you with product quality and delivery promptness?
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSupplierRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star
                        size={22}
                        fill={(hoverRating || supplierRating) >= star ? '#F59E0B' : 'transparent'}
                        color={(hoverRating || supplierRating) >= star ? '#F59E0B' : 'var(--color-text-muted)'}
                      />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: '6px' }}>
                    {supplierRating} / 5 Stars
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          {currentPO.txt_Status !== 'Delivered' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-success btn-lg"
                onClick={handleConfirmDelivery}
              >
                <CheckSquare size={20} /> Confirm Material Receipt & Update Stock Quantity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
