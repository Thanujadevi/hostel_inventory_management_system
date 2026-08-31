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

import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

export const AdminQuotationCompare = () => {
  const { requests, quotations, items, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  // All active requirements or open requests
  const targetReqs = useMemo(() => {
    return requests.filter(r => 
      r.txt_Status === 'Open for Quotation' || r.txt_Status === 'Pending' || r.txt_Status === 'Approved' || r.txt_Status === 'Delivered'
    );
  }, [requests]);

  const [selectedReqId, setSelectedReqId] = useState(targetReqs[0]?.int_Request_Id || 1);

  const currentReq = requests.find(r => r.int_Request_Id === Number(selectedReqId)) || targetReqs[0];
  const reqQuotations = quotations.filter(q => q.int_Request_Id === Number(currentReq?.int_Request_Id));

  // Compute detailed statistics and Grand Total for each quotation
  const sortedQuotations = useMemo(() => {
    const totalReqItems = currentReq?.items?.length || 0;

    return reqQuotations.map(q => {
      let availableItemsCount = 0;
      const missingItems = [];

      (currentReq?.items || []).forEach(reqItem => {
        const qItem = q.items?.find(i => (i.int_Product_Id || i.int_Item_Id) === reqItem.int_Product_Id);
        const isAvail = qItem && qItem.is_available !== false && Number(qItem.dec_Unit_Price || 0) > 0;
        if (isAvail) {
          availableItemsCount++;
        } else {
          missingItems.push(reqItem);
        }
      });

      const coveragePercent = totalReqItems > 0 ? Math.round((availableItemsCount / totalReqItems) * 100) : 100;
      const grandTotal = Number(q.dec_Total_Amount || 0) + Number(q.dec_Transport_Cost || 0);

      return {
        ...q,
        totalReqItems,
        availableItemsCount,
        missingItems,
        coveragePercent,
        isFullCoverage: availableItemsCount === totalReqItems,
        grandTotal
      };
    }).sort((a, b) => {
      if (a.isFullCoverage !== b.isFullCoverage) {
        return a.isFullCoverage ? -1 : 1;
      }
      if (a.coveragePercent !== b.coveragePercent) {
        return b.coveragePercent - a.coveragePercent;
      }
      return a.grandTotal - b.grandTotal;
    });
  }, [reqQuotations, currentReq]);

  const optimumQuotation = sortedQuotations.length > 0 ? sortedQuotations[0] : null;

  const l1FullQuotation = sortedQuotations.find(q => q.isFullCoverage) || sortedQuotations[0];
  const highestQuotation = sortedQuotations.length > 1 ? sortedQuotations[sortedQuotations.length - 1] : null;

  const costSavings = optimumQuotation && highestQuotation 
    ? (highestQuotation.grandTotal - optimumQuotation.grandTotal) 
    : 0;

  const handleAwardPO = async (quotationId, supplierName) => {
    if (window.confirm(`Accept bid from ${supplierName} and automatically place official Purchase Order?`)) {
      try {
        const quo = quotations.find(q => q.int_Quotation_Id === quotationId);
        const poData = {
          int_Quotation_Id: quotationId,
          int_Request_Id: quo?.int_Request_Id || currentReq?.int_Request_Id,
          int_Supplier_Id: quo?.int_Supplier_Id || 1,
          int_Store_Id: currentReq?.int_Store_Id || 1,
          dbl_Total_Amount: quo?.dbl_Total_Amount || quo?.grandTotal || 0,
          txt_Status: 'PO Issued',
          txt_Created_By: activeUser,
          txt_Updated_By: activeUser
        };
        const newPO = await apiService.savePurchase(poData);
        try { await mockApi.approveQuotationAndGeneratePO(quotationId); } catch (e) {}
        showToast(`Quotation accepted! Purchase Order ${newPO?.txt_PO_Code || newPO?.po_number || 'PO'} placed with ${supplierName}.`, 'success');
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
            Compare price quotes from suppliers. The system automatically recommends the optimum bid based on 100% item availability and lowest total cost.
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
          {/* System Optimum Recommendation Banner */}
          {optimumQuotation && (
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
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#ffffff',
                        backgroundColor: 'var(--color-success-text, #059669)',
                        padding: '2px 10px',
                        borderRadius: '12px'
                      }}>
                        {optimumQuotation.isFullCoverage ? '🏆 Optimum Supplier (100% Full Fulfillment)' : '⚠️ Best Partial Supplier (Highest Coverage)'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success-text)' }}>
                        Item Coverage: {optimumQuotation.availableItemsCount}/{optimumQuotation.totalReqItems} ({optimumQuotation.coveragePercent}%)
                      </span>
                    </div>
                    <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Recommended Supplier: <span style={{ color: 'var(--color-success-text, #059669)' }}>{optimumQuotation.supplier_name}</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Offers available items at <strong style={{ color: 'var(--color-text-primary)', fontSize: '1rem' }}>₹{optimumQuotation.grandTotal.toLocaleString('en-IN')}</strong> (Transport: ₹{optimumQuotation.dec_Transport_Cost} | Delivery: {optimumQuotation.int_Delivery_Days} Days)
                      {costSavings > 0 && (
                        <span style={{ fontWeight: 600, color: 'var(--color-success-text, #059669)', marginLeft: '8px' }}>
                          — Saves ₹{costSavings.toLocaleString('en-IN')} compared to highest quote!
                        </span>
                      )}
                    </p>
                    {optimumQuotation.missingItems.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                        Missing Items from Bid: {optimumQuotation.missingItems.map(i => i.product_name).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {optimumQuotation.txt_Status === 'Approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success-text)', fontWeight: 700, fontSize: '1rem' }}>
                      <CheckCircle2 size={22} /> Order Placed
                    </div>
                  ) : (
                    <button
                      className="btn btn-success btn-lg"
                      disabled={currentReq.txt_Status === 'Approved' || currentReq.txt_Status === 'Delivered'}
                      onClick={() => handleAwardPO(optimumQuotation.int_Quotation_Id, optimumQuotation.supplier_name)}
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
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <th 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            minWidth: '220px',
                            backgroundColor: isOptimum ? 'var(--color-success-bg, #ecfdf5)' : 'var(--color-surface-hover)',
                            borderTop: isOptimum ? '3px solid var(--color-success-text, #059669)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {isOptimum && (
                              <span style={{
                                backgroundColor: 'var(--color-success-text, #059669)',
                                color: '#ffffff',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                textTransform: 'uppercase'
                              }}>
                                🏆 Optimum Choice
                              </span>
                            )}
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                              {q.supplier_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-purple-text)' }}>
                              Ref: {q.txt_Quotation_No || `QTN-2026-${String(q.int_Quotation_Id).padStart(3, '0')}`}
                            </div>
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '8px',
                              backgroundColor: q.isFullCoverage ? '#dcfce7' : '#fee2e2',
                              color: q.isFullCoverage ? '#15803d' : '#b91c1c'
                            }}>
                              Coverage: {q.availableItemsCount}/{q.totalReqItems} ({q.coveragePercent}%)
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
                    // Find lowest offered unit price for this product among available items
                    const validPrices = sortedQuotations.map(q => {
                      const qItem = q.items?.find(i => (i.int_Product_Id || i.int_Item_Id) === reqItem.int_Product_Id);
                      const isAvail = qItem && qItem.is_available !== false && Number(qItem.dec_Unit_Price || 0) > 0;
                      return isAvail ? Number(qItem.dec_Unit_Price) : Infinity;
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
                          const qItem = q.items?.find(i => (i.int_Product_Id || i.int_Item_Id) === reqItem.int_Product_Id);
                          const isAvail = qItem && qItem.is_available !== false && Number(qItem.dec_Unit_Price || 0) > 0;
                          const unitPrice = isAvail ? Number(qItem.dec_Unit_Price) : null;
                          const isLowestPrice = isAvail && unitPrice === minUnitPrice && validPrices.filter(p => p !== Infinity).length > 1;
                          const linePrice = isAvail ? Number(qItem.dec_Total_Price || (unitPrice * reqItem.dec_Required_Qty) || 0) : 0;

                          return (
                            <td 
                              key={q.int_Quotation_Id} 
                              style={{ 
                                textAlign: 'center',
                                backgroundColor: isAvail ? (isLowestPrice ? 'rgba(16, 185, 129, 0.08)' : 'transparent') : '#fff1f2'
                              }}
                            >
                              {isAvail ? (
                                <div>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isLowestPrice ? 'var(--color-success-text, #059669)' : 'var(--color-text-primary)' }}>
                                      ₹{unitPrice.toFixed(2)}
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
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#dc2626',
                                  backgroundColor: '#fef2f2',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fca5a5'
                                }}>
                                  ❌ Not Available / Out of Stock
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Items Subtotal row */}
                  <tr style={{ backgroundColor: 'var(--color-bg-secondary, #f8fafc)', fontWeight: 600 }}>
                    <td>Products Subtotal Price (Available Items)</td>
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
                    <td style={{ color: 'var(--color-primary)' }}>Grand Total Budget (Available Items + Freight)</td>
                    {sortedQuotations.map(q => {
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <td 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            color: isOptimum ? 'var(--color-success-text, #059669)' : 'var(--color-primary)',
                            fontSize: '1.1rem'
                          }}
                        >
                          ₹{q.grandTotal.toLocaleString('en-IN')}
                          {isOptimum && <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Optimum Recommendation</div>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action / Accept Bid Row */}
                  <tr>
                    <td style={{ fontWeight: 700 }}>Action: Accept Bid & Place Order</td>
                    {sortedQuotations.map(q => {
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '16px' }}>
                          {q.txt_Status === 'Approved' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--color-success-text)', fontWeight: 700 }}>
                              <CheckCircle2 size={18} /> PO Awarded & Placed
                            </div>
                          ) : (
                            <button
                              className={isOptimum ? "btn btn-success" : "btn btn-secondary"}
                              disabled={currentReq.txt_Status === 'Approved' || currentReq.txt_Status === 'Delivered'}
                              onClick={() => handleAwardPO(q.int_Quotation_Id, q.supplier_name)}
                              style={{ width: '100%', justifyContent: 'center', fontWeight: isOptimum ? 700 : 500 }}
                            >
                              <Award size={16} /> {isOptimum ? 'Accept Optimum Bid & Place Order' : 'Accept Bid & Place Order'}
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
