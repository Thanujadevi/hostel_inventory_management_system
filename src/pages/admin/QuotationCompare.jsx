import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  GitCompare, 
  Award, 
  Truck, 
  Calendar, 
  Star, 
  Trophy, 
  TrendingDown, 
  CheckCircle2, 
  ShoppingCart,
  Zap,
  Info
} from 'lucide-react';

export const AdminQuotationCompare = () => {
  const { requests, quotations, items, refreshAll, mockApi, showToast } = useData();

  // All active requirements or open requests
  const targetReqs = useMemo(() => {
    return requests.filter(r => 
      r.txt_Status === 'Open for Quotation' || r.txt_Status === 'Pending' || r.txt_Status === 'Approved' || r.txt_Status === 'Delivered'
    );
  }, [requests]);

  const [selectedReqId, setSelectedReqId] = useState(targetReqs[0]?.int_Request_Id || 1);

  const currentReq = requests.find(r => r.int_Request_Id === Number(selectedReqId)) || targetReqs[0];
  const reqQuotations = quotations.filter(q => q.int_Request_Id === Number(currentReq?.int_Request_Id));

  // Compute Grand Total for each quotation
  const sortedQuotations = useMemo(() => {
    return reqQuotations.map(q => {
      const grandTotal = Number(q.dec_Total_Amount || 0) + Number(q.dec_Transport_Cost || 0);
      return {
        ...q,
        grandTotal
      };
    }).sort((a, b) => a.grandTotal - b.grandTotal);
  }, [reqQuotations]);

  // Identify L1 (Lowest Bid / Minimum Budget Value)
  const l1Quotation = sortedQuotations.length > 0 ? sortedQuotations[0] : null;
  const highestQuotation = sortedQuotations.length > 1 ? sortedQuotations[sortedQuotations.length - 1] : null;

  const costSavings = l1Quotation && highestQuotation 
    ? (highestQuotation.grandTotal - l1Quotation.grandTotal) 
    : 0;

  const handleAwardPO = async (quotationId, supplierName) => {
    if (window.confirm(`Accept bid from ${supplierName} and automatically place official Purchase Order?`)) {
      try {
        const newPO = await mockApi.approveQuotationAndGeneratePO(quotationId);
        showToast(`Quotation accepted! Purchase Order ${newPO.po_number || 'generated'} placed with ${supplierName}.`, 'success');
        await refreshAll();
      } catch (err) {
        console.error("Error approving quotation:", err);
        showToast("Failed to place Purchase Order", "error");
      }
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Compare Price Quotes</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Compare price quotes from different suppliers. The system highlights the lowest quote (L1).
          </p>
        </div>
      </div>

      {/* Selector & Requirement Summary */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Select Request:
            </label>
            <select
              className="form-select"
              style={{ maxWidth: '480px', fontWeight: 600 }}
              value={selectedReqId}
              onChange={e => setSelectedReqId(Number(e.target.value))}
            >
              {targetReqs.length === 0 ? (
                <option value="">No open requests found</option>
              ) : (
                targetReqs.map(req => (
                  <option key={req.int_Request_Id} value={req.int_Request_Id}>
                    {req.txt_Request_No} — ({req.txt_Month} {req.int_Year} | Est. Budget: ₹{Number(req.dec_Budget).toLocaleString('en-IN')})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentReq && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Status:</span>
              <StatusBadge status={currentReq.txt_Status} />
            </div>
          )}
        </div>
      </div>

      {!currentReq ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No request selected.
        </div>
      ) : reqQuotations.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <GitCompare size={44} color="var(--color-text-muted)" style={{ marginBottom: '16px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Supplier Quotes Received Yet</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '500px', margin: '6px auto 0' }}>
            Suppliers have been notified for request <strong>{currentReq.txt_Request_No}</strong>. Submitted quotes will appear here for comparison.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Automated L1 System Recommendation Banner */}
          {l1Quotation && (
            <div style={{
              backgroundColor: 'var(--color-success-bg, #ecfdf5)',
              border: '2px solid var(--color-success-border, #a7f3d0)',
              borderRadius: '12px',
              padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    backgroundColor: 'var(--color-success-text, #059669)',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Trophy size={28} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-success-text, #059669)', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--color-success-border)' }}>
                        Lowest Price Option (L1)
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Recommended Supplier: <span style={{ color: 'var(--color-success-text, #059669)' }}>{l1Quotation.supplier_name}</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Offers the lowest total price of <strong style={{ color: 'var(--color-text-primary)', fontSize: '1rem' }}>₹{l1Quotation.grandTotal.toLocaleString('en-IN')}</strong> (Transport: ₹{l1Quotation.dec_Transport_Cost} | Delivery: {l1Quotation.int_Delivery_Days} Days)
                      {costSavings > 0 && (
                        <span style={{ fontWeight: 600, color: 'var(--color-success-text, #059669)', marginLeft: '8px' }}>
                          — Saves ₹{costSavings.toLocaleString('en-IN')} compared to highest quote!
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  {l1Quotation.txt_Status === 'Approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success-text)', fontWeight: 700, fontSize: '1rem' }}>
                      <CheckCircle2 size={22} /> Order Placed
                    </div>
                  ) : (
                    <button
                      className="btn btn-success btn-lg"
                      disabled={currentReq.txt_Status === 'Approved' || currentReq.txt_Status === 'Delivered'}
                      onClick={() => handleAwardPO(l1Quotation.int_Quotation_Id, l1Quotation.supplier_name)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 700 }}
                    >
                      <ShoppingCart size={18} /> Accept Quote & Place Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comparative Matrix Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Product-Wise Bid Comparison Matrix</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Comparing {sortedQuotations.length} supplier quotation(s)
              </span>
            </div>

            <div className="table-container">
              <table className="table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px', backgroundColor: 'var(--color-bg-secondary, #f8fafc)' }}>Requested Item</th>
                    {sortedQuotations.map((q, idx) => {
                      const isL1 = l1Quotation && q.int_Quotation_Id === l1Quotation.int_Quotation_Id;
                      return (
                        <th 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            minWidth: '220px',
                            backgroundColor: isL1 ? 'var(--color-success-bg, #ecfdf5)' : 'var(--color-surface-hover)',
                            borderTop: isL1 ? '3px solid var(--color-success-text, #059669)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {isL1 && (
                              <span style={{
                                backgroundColor: 'var(--color-success-text, #059669)',
                                color: '#ffffff',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                textTransform: 'uppercase'
                              }}>
                                🏆 L1 Lowest Bid
                              </span>
                            )}
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                              {q.supplier_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-purple-text)' }}>
                              Ref: {q.txt_Quotation_No || `QTN-2026-${String(q.int_Quotation_Id).padStart(3, '0')}`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {Number(q.supplier_rating || 0) > 0 ? (
                                <>
                                  <Star size={12} fill="#F59E0B" color="#F59E0B" /> Rating: {Number(q.supplier_rating).toFixed(1)}
                                </>
                              ) : (
                                <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Unrated</span>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {/* Product-wise Unit Price comparison */}
                  {currentReq.items?.map((reqItem, idx) => {
                    // Find lowest offered unit price for this product
                    const validPrices = sortedQuotations.map(q => {
                      const qItem = q.items?.find(i => i.int_Product_Id === reqItem.int_Product_Id);
                      return (qItem && qItem.dec_Unit_Price !== undefined && !isNaN(qItem.dec_Unit_Price)) 
                        ? Number(qItem.dec_Unit_Price) 
                        : Infinity;
                    });
                    const minUnitPrice = validPrices.length > 0 && validPrices.some(p => p !== Infinity) 
                      ? Math.min(...validPrices) 
                      : 0;

                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{reqItem.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Required Qty: <strong>{reqItem.dec_Required_Qty} {reqItem.unit}</strong>
                          </div>
                        </td>

                        {sortedQuotations.map(q => {
                          const qItem = q.items?.find(i => i.int_Product_Id === reqItem.int_Product_Id);
                          const unitPrice = (qItem && qItem.dec_Unit_Price !== undefined) ? Number(qItem.dec_Unit_Price) : null;
                          const isLowestPrice = unitPrice !== null && !isNaN(unitPrice) && unitPrice === minUnitPrice && validPrices.filter(p => p !== Infinity).length > 1;
                          const linePrice = qItem ? Number(qItem.dec_Total_Price || (qItem.dec_Unit_Price * reqItem.dec_Required_Qty) || 0) : 0;

                          return (
                            <td 
                              key={q.int_Quotation_Id} 
                              style={{ 
                                textAlign: 'center',
                                backgroundColor: isLowestPrice ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                              }}
                            >
                              {qItem ? (
                                <div>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isLowestPrice ? 'var(--color-success-text, #059669)' : 'var(--color-text-primary)' }}>
                                      ₹{Number(qItem.dec_Unit_Price || 0).toFixed(2)}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>/ {reqItem.unit}</span>
                                    {isLowestPrice && (
                                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffffff', backgroundColor: '#059669', padding: '1px 5px', borderRadius: '4px' }}>
                                        LOWEST
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    Total: ₹{linePrice.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }}>N/A</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Items Subtotal row */}
                  <tr style={{ backgroundColor: 'var(--color-bg-secondary, #f8fafc)', fontWeight: 600 }}>
                    <td>Products Subtotal Price</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', fontWeight: 700 }}>
                        ₹{Number(q.dec_Total_Amount).toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>

                  {/* Freight / Transport Cost row */}
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={16} color="var(--color-primary)" />
                        <span>Freight & Transport Charge</span>
                      </div>
                    </td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-primary)' }}>
                        ₹{Number(q.dec_Transport_Cost).toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>

                  {/* Delivery Turnaround Days */}
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} color="var(--color-warning-text)" />
                        <span>Delivery Turnaround Time</span>
                      </div>
                    </td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', fontWeight: 700 }}>
                        {q.int_Delivery_Days} Days
                      </td>
                    ))}
                  </tr>

                  {/* Grand Total Row */}
                  <tr style={{ backgroundColor: 'var(--color-primary-light)', fontSize: '1.05rem', fontWeight: 700 }}>
                    <td style={{ color: 'var(--color-primary)' }}>Grand Total Budget (Items + Freight)</td>
                    {sortedQuotations.map(q => {
                      const isL1 = l1Quotation && q.int_Quotation_Id === l1Quotation.int_Quotation_Id;
                      return (
                        <td 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            color: isL1 ? 'var(--color-success-text, #059669)' : 'var(--color-primary)',
                            fontSize: '1.1rem'
                          }}
                        >
                          ₹{q.grandTotal.toLocaleString('en-IN')}
                          {isL1 && <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Minimum Value (L1)</div>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action / Accept Bid Row */}
                  <tr>
                    <td style={{ fontWeight: 700 }}>Action: Accept Bid & Place Order</td>
                    {sortedQuotations.map(q => {
                      const isL1 = l1Quotation && q.int_Quotation_Id === l1Quotation.int_Quotation_Id;
                      return (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '16px' }}>
                          {q.txt_Status === 'Approved' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--color-success-text)', fontWeight: 700 }}>
                              <CheckCircle2 size={18} /> PO Awarded & Placed
                            </div>
                          ) : (
                            <button
                              className={isL1 ? "btn btn-success" : "btn btn-secondary"}
                              disabled={currentReq.txt_Status === 'Approved' || currentReq.txt_Status === 'Delivered'}
                              onClick={() => handleAwardPO(q.int_Quotation_Id, q.supplier_name)}
                              style={{ width: '100%', justifyContent: 'center', fontWeight: isL1 ? 700 : 500 }}
                            >
                              <Award size={16} /> {isL1 ? 'Accept L1 Bid & Place Order' : 'Accept Bid & Place Order'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
