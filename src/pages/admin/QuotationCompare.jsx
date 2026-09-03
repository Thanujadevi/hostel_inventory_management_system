import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  User,
  Phone,
  Mail,
  FileText,
  Star,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

export const AdminQuotationCompare = () => {
  const { requests, quotations, purchases, suppliers, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  // All open/unawarded requirements or requests
  const targetReqs = useMemo(() => {
    return requests.filter(r => 
      r.txt_Status !== 'Approved' && r.txt_Status !== 'PO Issued' && r.txt_Status !== 'Delivered' && r.txt_Status !== 'Completed' && r.txt_Status !== 'Rejected'
    );
  }, [requests]);

  const [selectedReqId, setSelectedReqId] = useState(targetReqs[0]?.int_Request_Id || '');
  const currentReq = targetReqs.find(r => r.int_Request_Id === Number(selectedReqId)) || targetReqs[0];

  const isOrderPlaced = useMemo(() => {
    if (!currentReq) return false;
    const reqStatus = String(currentReq.txt_Status || '').toLowerCase();
    if (['approved', 'po issued', 'delivered', 'completed', 'dispatched', 'shipped'].includes(reqStatus)) return true;

    return (purchases || []).some(p => 
      Number(p.int_Request_Id) === Number(currentReq.int_Request_Id)
    );
  }, [currentReq, purchases]);

  // Pagination state for product items comparison table
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(5);

  useEffect(() => {
    setItemsPage(1);
  }, [selectedReqId, itemsPageSize]);

  const totalReqItems = currentReq?.items?.length || 0;
  const itemsTotalPages = Math.ceil(totalReqItems / itemsPageSize) || 1;
  const itemsStartIndex = (itemsPage - 1) * itemsPageSize;
  const paginatedReqItems = useMemo(() => {
    return (currentReq?.items || []).slice(itemsStartIndex, itemsStartIndex + itemsPageSize);
  }, [currentReq, itemsStartIndex, itemsPageSize]);

  const reqQuotations = useMemo(() => {
    const rawQuotes = quotations.filter(q => Number(q.int_Request_Id) === Number(currentReq?.int_Request_Id));
    const supplierMap = new Map();
    
    rawQuotes.forEach(q => {
      const sId = q.int_Supplier_Id || q.supplier_name || q.txt_Supplier_Name || q.int_Quotation_Id;
      if (!supplierMap.has(sId)) {
        supplierMap.set(sId, q);
      } else {
        const existing = supplierMap.get(sId);
        if (Number(q.int_Quotation_Id) > Number(existing.int_Quotation_Id)) {
          supplierMap.set(sId, q);
        }
      }
    });

    return Array.from(supplierMap.values());
  }, [quotations, currentReq]);

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
      const grandTotal = itemsSubtotal > 0 ? (itemsSubtotal + transport) : Number(q.dec_Total_Amount ?? q.dbl_Total_Amount ?? 0);

      // Resolve supplier record details
      const sup = (suppliers || []).find(s => Number(s.int_Supplier_Id) === Number(q.int_Supplier_Id));
      const supplierName = sup?.txt_Store_Name || sup?.txt_Supplier_Name || q.supplier_name || q.txt_Store_Name || q.txt_Supplier_Name || `Supplier #${q.int_Supplier_Id || ''}`;
      const ownerName = sup?.txt_Owner_Name || sup?.txt_Contact_Person || q.supplier_owner || q.txt_Owner_Name || q.txt_Contact_Person || '';
      const phone = sup?.txt_Phone || q.supplier_phone || q.txt_Phone || '';
      const email = sup?.txt_Email || q.supplier_email || q.txt_Email || '';
      const gst = sup?.txt_GST_Number || sup?.txt_GSTIN || q.supplier_gst || q.txt_GST_Number || q.txt_GSTIN || '';
      const rating = Number(sup?.dbl_Rating ?? q.supplier_rating ?? q.dbl_Rating ?? 0);
      const cityState = (sup?.txt_City && sup?.txt_State)
        ? `${sup.txt_City}, ${sup.txt_State}`
        : (sup?.txt_City || sup?.txt_State || q.supplier_city || q.supplier_state || '');

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
        grandTotal,
        supplierName,
        ownerName,
        phone,
        email,
        gst,
        rating,
        cityState
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
  }, [reqQuotations, currentReq, suppliers]);

  const optimumQuotation = sortedQuotations.length > 0 ? sortedQuotations[0] : null;
  const highestQuotation = sortedQuotations.length > 1 ? sortedQuotations[sortedQuotations.length - 1] : null;

  const costSavings = optimumQuotation && highestQuotation 
    ? (highestQuotation.grandTotal - optimumQuotation.grandTotal) 
    : 0;

  const handleAwardPO = async (quotationId, supplierName) => {
    if (window.confirm(`Accept bid from ${supplierName} and automatically place official Purchase Order?`)) {
      try {
        const quo = quotations.find(q => q.int_Quotation_Id === quotationId);
        const finalTotal = Number(quo?.dec_Total_Amount || quo?.grandTotal || 0) + Number(quo?.dec_Transport_Cost || quo?.transport || 0);
        const poData = {
          int_Quotation_Id: quotationId,
          int_Request_Id: quo?.int_Request_Id || currentReq?.int_Request_Id,
          int_Supplier_Id: quo?.int_Supplier_Id || 1,
          int_Store_Id: currentReq?.int_Store_Id || 1,
          dbl_Total_Amount: finalTotal > 0 ? finalTotal : 5200,
          txt_Status: 'PO Issued',
          txt_Created_By: activeUser,
          txt_Updated_By: activeUser
        };
        let newPO;
        try {
          newPO = await apiService.savePurchase(poData);
        } catch (e) {
          newPO = await mockApi.approveQuotationAndGeneratePO(quotationId);
        }
        showToast(`Quotation accepted! Purchase Order ${newPO?.po_number || newPO?.txt_PO_Code || 'PO'} sent to ${supplierName} for fulfillment.`, 'success');
        await refreshAll();
      } catch (err) {
        console.error("Error approving quotation:", err);
        showToast("Failed to place Purchase Order", "error");
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to reject and delete this request? This will permanently remove it from the database.")) {
      try {
        await apiService.deleteRequest(requestId);
        showToast("Request rejected and deleted from database!", "info");
        await refreshAll();
      } catch (err) {
        showToast("Failed to delete request", "error");
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.9rem' }}>
              Select Request:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={targetReqs.findIndex(r => r.int_Request_Id === Number(selectedReqId)) <= 0}
                onClick={() => {
                  const idx = targetReqs.findIndex(r => r.int_Request_Id === Number(selectedReqId));
                  if (idx > 0) setSelectedReqId(targetReqs[idx - 1].int_Request_Id);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Previous Request"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <select
                className="form-select"
                style={{ maxWidth: '380px', fontWeight: 600, fontSize: '0.9rem' }}
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

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={targetReqs.findIndex(r => r.int_Request_Id === Number(selectedReqId)) >= targetReqs.length - 1}
                onClick={() => {
                  const idx = targetReqs.findIndex(r => r.int_Request_Id === Number(selectedReqId));
                  if (idx >= 0 && idx < targetReqs.length - 1) setSelectedReqId(targetReqs[idx + 1].int_Request_Id);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Next Request"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {currentReq && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleRejectRequest(currentReq.int_Request_Id)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                title="Reject and delete this request from database"
              >
                <X size={14} /> Reject Request
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Status:</span>
              <StatusBadge status={currentReq.txt_Status} />
            </div>
          )}
        </div>
      </div>

      {!currentReq ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--color-success-text)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>All Price Quotes Processed into Purchase Orders</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '540px', margin: '6px auto 0' }}>
            All submitted supplier price quotes have been evaluated, accepted, and converted into official Purchase Orders for <strong>National Engineering College</strong>.
          </p>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    backgroundColor: '#059669',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.2rem', fontWeight: 800, color: '#064e3b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {optimumQuotation.supplierName}
                      {optimumQuotation.ownerName && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#047857' }}>
                          (Prop: {optimumQuotation.ownerName})
                        </span>
                      )}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#047857', marginTop: '3px' }}>
                      {optimumQuotation.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} /> {optimumQuotation.phone}
                        </span>
                      )}
                      {optimumQuotation.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} /> {optimumQuotation.email}
                        </span>
                      )}
                      {optimumQuotation.gst && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={13} /> GST: {optimumQuotation.gst}
                        </span>
                      )}
                      {optimumQuotation.rating > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#b45309' }}>
                          <Star size={13} fill="#f59e0b" color="#f59e0b" /> {optimumQuotation.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#047857' }}>
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
                  {isOrderPlaced || optimumQuotation.txt_Status === 'Approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.95rem' }}>
                      <CheckCircle2 size={20} /> Order Placed & PO Issued
                    </div>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={() => handleAwardPO(optimumQuotation.int_Quotation_Id, optimumQuotation.supplierName)}
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
                    <th style={{ width: '220px', backgroundColor: '#f8fafc', padding: '14px 16px', verticalAlign: 'top' }}>Requested Item</th>
                    {sortedQuotations.map(q => {
                      const isOptimum = optimumQuotation && q.int_Quotation_Id === optimumQuotation.int_Quotation_Id;
                      return (
                        <th 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            minWidth: '210px',
                            backgroundColor: isOptimum ? '#ecfdf5' : '#ffffff',
                            padding: '14px 16px',
                            borderLeft: '1px solid var(--color-border)',
                            verticalAlign: 'top'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {isOptimum && (
                              <span style={{
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                textTransform: 'uppercase',
                                marginBottom: '2px'
                              }}>
                                Recommended
                              </span>
                            )}
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building2 size={15} style={{ color: '#0284c7', flexShrink: 0 }} />
                              {q.supplierName}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-purple-text, #6b21a8)', backgroundColor: '#f3e8ff', padding: '1px 8px', borderRadius: '4px' }}>
                              {q.txt_Quotation_No || `QTN-${String(q.int_Quotation_Id).padStart(3, '0')}`}
                            </div>

                            {/* Detailed Supplier Contact Card in Header */}
                            <div style={{
                              marginTop: '8px',
                              width: '100%',
                              padding: '8px 10px',
                              backgroundColor: 'var(--color-bg-secondary, #f8fafc)',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)',
                              fontSize: '0.75rem',
                              textAlign: 'left',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              color: 'var(--color-text-secondary)',
                              fontWeight: 400
                            }}>
                              {q.ownerName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  <User size={12} color="#475569" style={{ flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Prop: {q.ownerName}</span>
                                </div>
                              )}
                              {q.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Phone size={12} color="#0284c7" style={{ flexShrink: 0 }} />
                                  <span>{q.phone}</span>
                                </div>
                              )}
                              {q.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <Mail size={12} color="#0284c7" style={{ flexShrink: 0 }} />
                                  <span title={q.email}>{q.email}</span>
                                </div>
                              )}
                              {q.gst && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <FileText size={12} color="#059669" style={{ flexShrink: 0 }} />
                                  <span>GST: {q.gst}</span>
                                </div>
                              )}
                              {q.cityState && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <MapPin size={12} color="#e11d48" style={{ flexShrink: 0 }} />
                                  <span>{q.cityState}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Rating:</span>
                                {q.rating > 0 ? (
                                  <span style={{ fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Star size={11} fill="#f59e0b" color="#f59e0b" /> {q.rating.toFixed(1)}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Unrated</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {/* Supplier Details Header Divider */}
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    <td colSpan={sortedQuotations.length + 1} style={{ padding: '8px 16px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      📋 Supplier Profile & Contact Details
                    </td>
                  </tr>

                  {/* Supplier Business Name Row */}
                  <tr>
                    <td style={{ padding: '10px 16px', fontWeight: 600, backgroundColor: '#f8fafc' }}>Business / Store Name</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)', fontWeight: 700, color: '#0f172a' }}>
                        {q.supplierName}
                      </td>
                    ))}
                  </tr>

                  {/* Contact Person / Owner Row */}
                  <tr>
                    <td style={{ padding: '10px 16px', fontWeight: 600, backgroundColor: '#f8fafc' }}>Proprietor / Contact Person</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)', color: '#334155' }}>
                        {q.ownerName || '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Phone & Email Row */}
                  <tr>
                    <td style={{ padding: '10px 16px', fontWeight: 600, backgroundColor: '#f8fafc' }}>Contact Phone & Email</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 600 }}>{q.phone || '—'}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{q.email || ''}</div>
                      </td>
                    ))}
                  </tr>

                  {/* GSTIN Row */}
                  <tr>
                    <td style={{ padding: '10px 16px', fontWeight: 600, backgroundColor: '#f8fafc' }}>GSTIN / Tax ID</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                        {q.gst || '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Rating Row */}
                  <tr>
                    <td style={{ padding: '10px 16px', fontWeight: 600, backgroundColor: '#f8fafc' }}>Supplier Rating</td>
                    {sortedQuotations.map(q => (
                      <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)' }}>
                        {q.rating > 0 ? (
                          <span style={{ color: '#b45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" /> {q.rating.toFixed(1)} / 5.0
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Unrated</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Items Unit Price Comparison Header Divider */}
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>
                    <td colSpan={sortedQuotations.length + 1} style={{ padding: '8px 16px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      📦 Product Price Bids & Stock Comparison
                    </td>
                  </tr>

                  {/* Product-wise Unit Price comparison */}
                  {paginatedReqItems?.map((reqItem, idx) => {
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
                          {isOrderPlaced || q.txt_Status === 'Approved' ? (
                            <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
                              PO Issued
                            </span>
                          ) : (
                            <button
                              className={isOptimum ? "btn btn-success btn-sm" : "btn btn-secondary btn-sm"}
                              onClick={() => handleAwardPO(q.int_Quotation_Id, q.supplierName)}
                              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                            >
                              Accept Quote
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Items Table Pagination Controls Footer */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 20px', 
              backgroundColor: 'var(--color-bg-secondary, #f8fafc)', 
              borderTop: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Showing <strong>{totalReqItems > 0 ? itemsStartIndex + 1 : 0} - {Math.min(itemsStartIndex + itemsPageSize, totalReqItems)}</strong> of <strong>{totalReqItems}</strong> requested items
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <span>Items per page:</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '3px 8px', fontSize: '0.8rem', fontWeight: 600 }}
                    value={itemsPageSize}
                    onChange={e => setItemsPageSize(Number(e.target.value))}
                  >
                    <option value={5}>5 items</option>
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>All items</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginRight: '6px' }}>
                  Page <strong>{itemsPage}</strong> of <strong>{itemsTotalPages}</strong>
                </span>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={itemsPage === 1}
                  onClick={() => setItemsPage(prev => Math.max(prev - 1, 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: itemsPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {Array.from({ length: itemsTotalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn btn-sm ${itemsPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setItemsPage(pageNum)}
                    style={{ minWidth: '32px', padding: '4px 8px', fontWeight: 700 }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={itemsPage === itemsTotalPages}
                  onClick={() => setItemsPage(prev => Math.min(prev + 1, itemsTotalPages))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: itemsPage === itemsTotalPages ? 0.5 : 1 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
