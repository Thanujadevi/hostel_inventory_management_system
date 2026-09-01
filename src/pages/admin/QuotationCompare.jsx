import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  GitCompare, 
  Award, 
  Truck, 
  Calendar, 
  Trophy, 
  CheckCircle2, 
  ShoppingCart,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

export const AdminQuotationCompare = () => {
  const { requests, quotations, refreshAll, mockApi, showToast } = useData();
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
      let itemsSubtotal = 0;
      const missingItems = [];

      (currentReq?.items || []).forEach(reqItem => {
        const reqPId = Number(reqItem.int_Product_Id || reqItem.int_Item_Id);
        const qItem = q.items?.find(i => Number(i.int_Product_Id || i.int_Item_Id) === reqPId);
        const price = Number(qItem?.dec_Unit_Price ?? qItem?.dbl_Unit_Price ?? qItem?.unit_price ?? 0);
        const isAvail = qItem && qItem.is_available !== false && qItem.txt_Status !== 'Not Available' && price > 0;
        const reqQty = Number(reqItem.dec_Required_Qty || reqItem.int_Requested_Quantity || reqItem.int_Quantity || reqItem.quantity || 1);

        if (isAvail) {
          availableItemsCount++;
          itemsSubtotal += price * reqQty;
        } else {
          missingItems.push(reqItem);
        }
      });

      const coveragePercent = totalReqItems > 0 ? Math.round((availableItemsCount / totalReqItems) * 100) : 100;
      const transport = Number(q.dec_Transport_Cost ?? q.dbl_Transport_Cost ?? q.transportCost ?? 500);
      const deliveryDays = q.txt_Delivery_Days || (q.int_Delivery_Days ? `${q.int_Delivery_Days} Days` : '3 Days');
      const computedTotal = Number(q.dec_Total_Amount ?? q.dbl_Total_Amount ?? (itemsSubtotal + transport));
      const grandTotal = computedTotal > 0 ? computedTotal : (itemsSubtotal + transport);

      return {
        ...q,
        totalReqItems,
        availableItemsCount,
        missingItems,
        coveragePercent,
        isFullCoverage: availableItemsCount === totalReqItems,
        itemsSubtotal,
        transport,
        deliveryDays,
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Compare Price Quotes</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Compare price quotes from suppliers and select the optimum bid.
          </p>
        </div>
      </div>

      {/* Selector & Requirement Summary */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.9rem' }}>
              Select Request:
            </label>
            <select
              className="form-select"
              style={{ maxWidth: '440px', fontWeight: 600, fontSize: '0.9rem' }}
              value={selectedReqId}
              onChange={e => setSelectedReqId(Number(e.target.value))}
            >
              {targetReqs.length === 0 ? (
                <option value="">No open requests found</option>
              ) : (
                targetReqs.map(req => (
                  <option key={req.int_Request_Id} value={req.int_Request_Id}>
                    {req.txt_Request_No} — ({req.txt_Month} {req.int_Year} | Est. Budget: ₹{Number(req.dec_Budget || 0).toLocaleString('en-IN')})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentReq && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Status:</span>
              <StatusBadge status={currentReq.txt_Status} />
            </div>
          )}
        </div>
      </div>

      {!currentReq ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No request selected.
        </div>
      ) : reqQuotations.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <GitCompare size={40} color="var(--color-text-muted)" style={{ marginBottom: '12px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Supplier Quotes Received Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px', maxWidth: '480px', margin: '4px auto 0' }}>
            Suppliers have been notified for request <strong>{currentReq.txt_Request_No}</strong>. Submitted quotes will appear here for comparison.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* System Optimum Recommendation Banner */}
          {optimumQuotation && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Trophy size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        backgroundColor: '#059669',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {optimumQuotation.isFullCoverage ? 'Recommended Supplier' : 'Best Available Supplier'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>
                        Coverage: {optimumQuotation.availableItemsCount}/{optimumQuotation.totalReqItems} ({optimumQuotation.coveragePercent}%)
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem', fontWeight: 700, color: '#064e3b' }}>
                      {optimumQuotation.supplier_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}>
                      Total Bid: <strong style={{ color: '#064e3b', fontSize: '0.95rem' }}>₹{optimumQuotation.grandTotal.toLocaleString('en-IN')}</strong>
                      <span style={{ opacity: 0.85, marginLeft: '6px' }}>
                        (Items: ₹{optimumQuotation.itemsSubtotal.toLocaleString('en-IN')} + Transport: ₹{optimumQuotation.transport.toLocaleString('en-IN')} | Delivery: {optimumQuotation.deliveryDays})
                      </span>
                      {costSavings > 0 && (
                        <span style={{ fontWeight: 700, color: '#047857', marginLeft: '8px' }}>
                          — Saves ₹{costSavings.toLocaleString('en-IN')}!
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  {optimumQuotation.txt_Status === 'Approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.95rem' }}>
                      <CheckCircle2 size={20} /> Order Placed
                    </div>
                  ) : (
                    <button
                      className="btn btn-success"
                      disabled={currentReq.txt_Status === 'Approved' || currentReq.txt_Status === 'Delivered'}
                      onClick={() => handleAwardPO(optimumQuotation.int_Quotation_Id, optimumQuotation.supplier_name)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                      <ShoppingCart size={16} /> Accept Quote & Place Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comparative Matrix Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', backgroundColor: 'var(--color-bg-secondary, #f8fafc)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Supplier Quotes Comparison</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {sortedQuotations.length} Quotation(s) Available
              </span>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '220px', backgroundColor: '#f8fafc', padding: '12px 16px' }}>Requested Item</th>
                    {sortedQuotations.map(q => {
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <th 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            minWidth: '180px',
                            backgroundColor: isOptimum ? '#ecfdf5' : '#ffffff',
                            padding: '12px 16px',
                            borderLeft: '1px solid var(--color-border)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            {isOptimum && (
                              <span style={{
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '8px',
                                textTransform: 'uppercase',
                                marginBottom: '2px'
                              }}>
                                Recommended
                              </span>
                            )}
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                              {q.supplier_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                              {q.txt_Quotation_No || `QTN-${String(q.int_Quotation_Id).padStart(3, '0')}`}
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
                    const reqPId = Number(reqItem.int_Product_Id || reqItem.int_Item_Id);
                    const validPrices = sortedQuotations.map(q => {
                      const qItem = q.items?.find(i => Number(i.int_Product_Id || i.int_Item_Id) === reqPId);
                      const price = Number(qItem?.dec_Unit_Price ?? qItem?.dbl_Unit_Price ?? qItem?.unit_price ?? 0);
                      const isAvail = qItem && qItem.is_available !== false && qItem.txt_Status !== 'Not Available' && price > 0;
                      return isAvail ? price : Infinity;
                    });
                    const minUnitPrice = validPrices.length > 0 && validPrices.some(p => p !== Infinity) 
                      ? Math.min(...validPrices) 
                      : 0;

                    return (
                      <tr key={idx}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          <div>{reqItem.product_name || reqItem.txt_Item_Name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginTop: '2px' }}>
                            Req Qty: {reqItem.dec_Required_Qty || reqItem.int_Requested_Quantity || reqItem.int_Quantity || reqItem.quantity || 0} {reqItem.unit || reqItem.txt_Unit || 'Pcs'}
                          </div>
                        </td>

                        {sortedQuotations.map(q => {
                          const qItem = q.items?.find(i => Number(i.int_Product_Id || i.int_Item_Id) === reqPId);
                          const unitPrice = Number(qItem?.dec_Unit_Price ?? qItem?.dbl_Unit_Price ?? qItem?.unit_price ?? 0);
                          const isAvail = qItem && qItem.is_available !== false && qItem.txt_Status !== 'Not Available' && unitPrice > 0;
                          const isLowestPrice = isAvail && unitPrice === minUnitPrice && validPrices.filter(p => p !== Infinity).length > 1;
                          const reqQty = Number(reqItem.dec_Required_Qty || reqItem.int_Requested_Quantity || reqItem.int_Quantity || reqItem.quantity || 0);
                          const linePrice = isAvail ? Number(qItem?.dec_Total_Price || qItem?.dbl_Total_Price || (unitPrice * reqQty) || 0) : 0;

                          return (
                            <td 
                              key={q.int_Quotation_Id} 
                              style={{ 
                                textAlign: 'center',
                                padding: '12px 16px',
                                borderLeft: '1px solid var(--color-border)',
                                backgroundColor: isAvail ? (isLowestPrice ? '#f0fdf4' : 'transparent') : '#fef2f2'
                              }}
                            >
                              {isAvail ? (
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isLowestPrice ? '#047857' : 'var(--color-text-primary)' }}>
                                    ₹{unitPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-secondary)' }}>/ {reqItem.unit || 'Pcs'}</span>
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    Subtotal: ₹{linePrice.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                  Out of Stock
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Items Subtotal row */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                    <td style={{ padding: '10px 16px' }}>Products Subtotal</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)' }}>
                        ₹{Number(q.itemsSubtotal || 0).toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>

                  {/* Freight / Transport Charge row */}
                  <tr>
                    <td style={{ padding: '10px 16px' }}>Freight / Transport</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)' }}>
                        ₹{Number(q.transport || 0).toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>

                  {/* Delivery Turnaround Days */}
                  <tr>
                    <td style={{ padding: '10px 16px' }}>Delivery Time</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)', fontWeight: 600 }}>
                        {q.deliveryDays}
                      </td>
                    ))}
                  </tr>

                  {/* Grand Total Row */}
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>
                    <td style={{ padding: '12px 16px' }}>Grand Total</td>
                    {sortedQuotations.map(q => {
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <td 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            padding: '12px 16px',
                            borderLeft: '1px solid var(--color-border)',
                            color: isOptimum ? '#047857' : 'var(--color-text-primary)',
                            fontSize: '1rem'
                          }}
                        >
                          ₹{Number(q.grandTotal || 0).toLocaleString('en-IN')}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action / Accept Bid Row */}
                  <tr>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>Action</td>
                    {sortedQuotations.map(q => {
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '14px 16px', borderLeft: '1px solid var(--color-border)' }}>
                          {q.txt_Status === 'Approved' ? (
                            <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
                              PO Issued
                            </span>
                          ) : (
                            <button
                              className={isOptimum ? "btn btn-success btn-sm" : "btn btn-secondary btn-sm"}
                              disabled={currentReq.txt_Status === 'Approved' || currentReq.txt_Status === 'Delivered'}
                              onClick={() => handleAwardPO(q.int_Quotation_Id, q.supplier_name)}
                              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                            >
                              {isOptimum ? 'Accept Quote' : 'Accept Quote'}
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
