import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Send, Truck, Package, Layers, CheckCircle } from 'lucide-react';
import { generateQuotationCode } from '../../utils/codeGenerator';

export const SupplierRequirements = () => {
  const { user } = useAuth();
  const { requests, quotations, mockApi, showToast, refreshAll } = useData();

  // Set of request IDs that current logged-in supplier has already submitted bids for
  const mySubmittedReqIds = useMemo(() => {
    return new Set(
      (quotations || [])
        .filter(q => q.int_Supplier_Id === user?.id || (user?.company && q.supplier_name === user.company))
        .map(q => Number(q.int_Request_Id))
    );
  }, [quotations, user]);

  // Open requirements that HAVE NOT been bid on yet by this supplier
  const openUnbiddedReqs = useMemo(() => {
    return requests.filter(r => {
      const isOpen = r.txt_Status === 'Open for Quotation' || r.txt_Status === 'Pending' || r.txt_Status === 'Open';
      const alreadyBidded = mySubmittedReqIds.has(Number(r.int_Request_Id));
      return isOpen && !alreadyBidded;
    });
  }, [requests, mySubmittedReqIds]);

  // Aggregate items product-wise across unbidded open requests (No store names)
  const consolidatedProducts = useMemo(() => {
    const targetReqs = openUnbiddedReqs;
    const map = {};

    targetReqs.forEach(req => {
      (req.items || []).forEach(item => {
        const pId = item.int_Product_Id;
        if (!map[pId]) {
          map[pId] = {
            int_Product_Id: pId,
            product_code: item.product_code || `PRD${String(pId).padStart(3, '0')}`,
            product_name: item.product_name || `Product #${pId}`,
            category: item.category || 'General',
            brand: item.brand || '',
            unit: item.unit || 'Pcs',
            total_required_qty: 0,
            req_ids: new Set()
          };
        }
        map[pId].total_required_qty += Number(item.dec_Required_Qty || 0);
        map[pId].req_ids.add(req.int_Request_Id);
      });
    });

    return Object.values(map);
  }, [openUnbiddedReqs]);

  const autoQuotationCode = generateQuotationCode(quotations || []);
  const [transportCost, setTransportCost] = useState(500);
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [remarks, setRemarks] = useState('Consolidated institutional rate with bulk delivery');
  const [loading, setLoading] = useState(false);

  // Per-product unit price map: { [product_id]: price }
  const [unitPrices, setUnitPrices] = useState({});
  // Per-product item availability map: { [product_id]: boolean } (default true)
  const [availability, setAvailability] = useState({});

  const handlePriceChange = (productId, price) => {
    setUnitPrices(prev => ({
      ...prev,
      [productId]: price === '' ? '' : Number(price)
    }));
  };

  const handleAvailabilityToggle = (productId, isAvailable) => {
    setAvailability(prev => ({
      ...prev,
      [productId]: isAvailable
    }));
  };

  // Calculate Subtotal & Grand Total (Sums only AVAILABLE items)
  const subtotalAmount = useMemo(() => {
    return consolidatedProducts.reduce((sum, prod) => {
      const isAvail = availability[prod.int_Product_Id] !== false;
      if (!isAvail) return sum;
      const price = unitPrices[prod.int_Product_Id] !== undefined && unitPrices[prod.int_Product_Id] !== ''
        ? Number(unitPrices[prod.int_Product_Id])
        : 120; // Default demo rate
      return sum + (price * prod.total_required_qty);
    }, 0);
  }, [consolidatedProducts, unitPrices, availability]);

  const grandTotal = subtotalAmount + Number(transportCost || 0);

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (consolidatedProducts.length === 0) {
      showToast("No open product requirements to bid on.", "warning");
      return;
    }

    setLoading(true);
    try {
      // Create bid per unbidded target open requirement
      const targetReqs = openUnbiddedReqs;
      
      for (const req of targetReqs) {
        if (!req) continue;
        const itemsList = (req.items || []).map(i => {
          const isAvail = availability[i.int_Product_Id] !== false;
          const uPrice = isAvail && unitPrices[i.int_Product_Id] !== undefined && unitPrices[i.int_Product_Id] !== ''
            ? Number(unitPrices[i.int_Product_Id])
            : (isAvail ? 120 : 0);
          return {
            int_Product_Id: i.int_Product_Id,
            dec_Unit_Price: isAvail ? uPrice : 0,
            dec_Available_Qty: i.dec_Required_Qty,
            is_available: isAvail
          };
        });

        const qData = {
          int_Request_Id: req.int_Request_Id,
          int_Supplier_Id: user?.id || 1,
          dbl_Total_Amount: Number(transportCost || 0) + itemsList.reduce((acc, item) => acc + (Number(item.dec_Unit_Price || 0) * Number(item.dec_Available_Qty || 1)), 0),
          txt_Delivery_Days: `${deliveryDays || 3} Days`,
          txt_Payment_Terms: 'Net 30',
          txt_Status: 'Submitted',
          txt_Created_By: user?.name || user?.username || user?.company || 'Supplier',
          txt_Updated_By: user?.name || user?.username || user?.company || 'Supplier',
          items: itemsList.map(i => ({
            int_Item_Id: i.int_Product_Id,
            int_Quantity: i.dec_Available_Qty,
            dbl_Unit_Price: i.dec_Unit_Price,
            dbl_Total_Price: i.dec_Unit_Price * i.dec_Available_Qty
          }))
        };

        await apiService.saveQuotation(qData);
        try { await mockApi.submitQuotation(qData, itemsList); } catch (e) {}
      }

      await refreshAll();
      showToast("Consolidated product-wise quotation bid submitted successfully!", "success");
    } catch (err) {
      console.error("Error submitting quotation:", err);
      showToast("Failed to submit quotation bid", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Product-Wise Consolidated Bidding</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Submit your competitive unit price bids for total consolidated product quantities. Toggle item availability if out of stock.
          </p>
        </div>
      </div>

      {consolidatedProducts.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          {mySubmittedReqIds.size > 0 ? (
            <>
              <CheckCircle size={44} color="var(--color-success-text, #059669)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                All Open Bids Submitted!
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
                Your firm has already submitted quotation bids for all active open requirements. Submitted requests no longer appear under open bidding.
              </p>
            </>
          ) : (
            <>
              <Package size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h3>No Open Product Requirements Available</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>There are currently no active product requirements open for bidding.</p>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmitQuote} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Consolidated Products Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Consolidated Product Requirements</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Total {consolidatedProducts.length} product(s) requested across active requirements
                </span>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <Layers size={14} style={{ marginRight: '6px' }} /> Product-Wise Consolidated View
              </span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Product Code & Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Total Required Qty</th>
                    <th style={{ width: '160px' }}>Item Availability</th>
                    <th style={{ width: '180px' }}>Offered Unit Price (₹)</th>
                    <th style={{ textAlign: 'right' }}>Calculated Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedProducts.map((prod, idx) => {
                    const isAvail = availability[prod.int_Product_Id] !== false;
                    const price = isAvail && unitPrices[prod.int_Product_Id] !== undefined && unitPrices[prod.int_Product_Id] !== ''
                      ? Number(unitPrices[prod.int_Product_Id])
                      : (isAvail ? 120 : 0);
                    const itemTotal = isAvail ? (price * prod.total_required_qty) : 0;

                    return (
                      <tr key={prod.int_Product_Id} style={{ opacity: isAvail ? 1 : 0.65, backgroundColor: isAvail ? 'transparent' : 'var(--color-bg-secondary, #f8fafc)' }}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{prod.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-purple-text)', fontWeight: 500 }}>
                            Code: {prod.product_code} {prod.brand ? `| Brand: ${prod.brand}` : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-bg-secondary, #f1f5f9)',
                            fontWeight: 600
                          }}>
                            {prod.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
                          {prod.total_required_qty.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{prod.unit}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleAvailabilityToggle(prod.int_Product_Id, true)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                cursor: 'pointer',
                                fontWeight: 700,
                                borderColor: isAvail ? '#059669' : '#cbd5e1',
                                backgroundColor: isAvail ? '#ecfdf5' : '#ffffff',
                                color: isAvail ? '#059669' : '#64748b'
                              }}
                            >
                              Available
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAvailabilityToggle(prod.int_Product_Id, false)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                cursor: 'pointer',
                                fontWeight: 700,
                                borderColor: !isAvail ? '#dc2626' : '#cbd5e1',
                                backgroundColor: !isAvail ? '#fef2f2' : '#ffffff',
                                color: !isAvail ? '#dc2626' : '#64748b'
                              }}
                            >
                              Not Available
                            </button>
                          </div>
                        </td>
                        <td>
                          {isAvail ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>₹</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="form-control"
                                style={{ fontWeight: 700, fontSize: '0.95rem' }}
                                required
                                onFocus={e => e.target.select()}
                                value={unitPrices[prod.int_Product_Id] !== undefined ? unitPrices[prod.int_Product_Id] : 120}
                                onChange={e => handlePriceChange(prod.int_Product_Id, e.target.value)}
                              />
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', fontStyle: 'italic' }}>
                              Out of Stock (₹0)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: isAvail ? 'var(--color-success-text)' : '#64748b' }}>
                          {isAvail ? `₹${itemTotal.toLocaleString('en-IN')}` : '₹0 (Not Supplied)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Terms Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Consolidated Freight & Delivery Terms</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quotation Reference Code</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={autoQuotationCode}
                  style={{ backgroundColor: 'var(--color-bg-secondary, #f8fafc)', fontWeight: 700, color: 'var(--color-purple-text)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Freight & Transport Charge (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={transportCost}
                  onChange={e => setTransportCost(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Turnaround (Days)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  value={deliveryDays}
                  onChange={e => setDeliveryDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quotation Notes / Commercial Terms</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Institutional bulk discount applied with door delivery"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing Summary & Submit */}
          <div className="card" style={{ backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Consolidated Bidding Summary</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Grand Total: <span style={{ color: 'var(--color-primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                    (Products Subtotal ₹{subtotalAmount.toLocaleString('en-IN')} + Freight ₹{transportCost})
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
              >
                <Send size={18} />
                <span>{loading ? 'Submitting Bid...' : 'Submit Consolidated Product Bid'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
