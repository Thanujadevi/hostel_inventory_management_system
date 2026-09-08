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
  ChevronRight,
  Sparkles,
  Layers,
  Info,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

export const AdminQuotationCompare = () => {
  const { requests, quotations, purchases, suppliers, updateRequestStatus, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  // Filter state for requirement list: 'OPEN' (unawarded), 'AWARDED' (PO issued), 'ALL'
  const [filterTab, setFilterTab] = useState('OPEN');
  // View mode switcher: 'cards' (Supplier Bid Cards), 'matrix' (Item-wise Comparison), 'inspector' (Detailed Inspector)
  const [viewMode, setViewMode] = useState('cards');

  // Filter requests based on selected filterTab
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const status = (r.txt_Status || '').toLowerCase();
      const isProcessed = ['approved', 'po issued', 'delivered', 'completed', 'rejected'].includes(status);
      const hasPO = (purchases || []).some(p => 
        Number(p.int_Request_Id) === Number(r.int_Request_Id) ||
        String(p.request_no) === String(r.txt_Request_No || r.txt_Request_Code)
      );
      const isAwarded = isProcessed || hasPO;

      if (filterTab === 'OPEN') return !isAwarded;
      if (filterTab === 'AWARDED') return isAwarded;
      return true; // 'ALL'
    });
  }, [requests, purchases, filterTab]);

  // Selected request state
  const [selectedReqId, setSelectedReqId] = useState('');

  // Auto-select first request when filter tab changes or data loads
  useEffect(() => {
    if (filteredRequests.length > 0) {
      const exists = filteredRequests.some(r => Number(r.int_Request_Id) === Number(selectedReqId));
      if (!exists) {
        setSelectedReqId(filteredRequests[0].int_Request_Id);
      }
    } else {
      setSelectedReqId('');
    }
  }, [filteredRequests, selectedReqId]);

  const currentReq = useMemo(() => {
    return requests.find(r => Number(r.int_Request_Id) === Number(selectedReqId)) || filteredRequests[0] || null;
  }, [requests, selectedReqId, filteredRequests]);

  const isOrderPlaced = useMemo(() => {
    if (!currentReq) return false;
    const reqStatus = String(currentReq.txt_Status || '').toLowerCase();
    if (['approved', 'po issued', 'delivered', 'completed', 'dispatched', 'shipped'].includes(reqStatus)) return true;

    return (purchases || []).some(p => 
      Number(p.int_Request_Id) === Number(currentReq.int_Request_Id) ||
      String(p.request_no) === String(currentReq.txt_Request_No || currentReq.txt_Request_Code)
    );
  }, [currentReq, purchases]);

  // Pagination state for product items comparison matrix table
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

  // Retrieve raw quotations for current selected request
  const reqQuotations = useMemo(() => {
    if (!currentReq) return [];
    const rawQuotes = quotations.filter(q => Number(q.int_Request_Id) === Number(currentReq.int_Request_Id));
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

  // Compute detailed statistics, breakdown, and Grand Total for each quotation
  const sortedQuotations = useMemo(() => {
    if (!currentReq) return [];
    const reqItemCount = currentReq?.items?.length || 0;

    const computed = reqQuotations.map(q => {
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

      const coveragePercent = reqItemCount > 0 ? Math.round((availableItemsCount / reqItemCount) * 100) : 100;
      const transport = Number(q.dec_Transport_Cost ?? q.dbl_Transport_Cost ?? q.transportCost ?? 0);
      const deliveryDays = q.txt_Delivery_Days || (q.int_Delivery_Days ? `${q.int_Delivery_Days} Days` : '3 Days');
      const grandTotal = itemsSubtotal > 0 ? (itemsSubtotal + transport) : Number(q.dec_Total_Amount ?? q.dbl_Total_Amount ?? 0);

      // Resolve supplier record details dynamically from database
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
        totalReqItems: reqItemCount,
        availableItemsCount,
        missingItems,
        coveragePercent,
        isFullCoverage: availableItemsCount === reqItemCount,
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
    });

    // Sort: Full coverage first, then highest coverage %, then lowest total bid price (L1)
    return computed.sort((a, b) => {
      if (a.isFullCoverage !== b.isFullCoverage) {
        return a.isFullCoverage ? -1 : 1;
      }
      if (a.coveragePercent !== b.coveragePercent) {
        return b.coveragePercent - a.coveragePercent;
      }
      return a.grandTotal - b.grandTotal;
    });
  }, [reqQuotations, currentReq, suppliers]);

  // Overall Lowest Price (L1) Recommendation
  const optimumQuotation = sortedQuotations.length > 0 ? sortedQuotations[0] : null;
  const highestQuotation = sortedQuotations.length > 1 ? sortedQuotations[sortedQuotations.length - 1] : null;

  const costSavings = optimumQuotation && highestQuotation 
    ? (highestQuotation.grandTotal - optimumQuotation.grandTotal) 
    : 0;

  // Selected supplier for Inspector View
  const [inspectorSupplierId, setInspectorSupplierId] = useState('');
  const activeInspectorQuote = useMemo(() => {
    if (!sortedQuotations.length) return null;
    return sortedQuotations.find(q => String(q.int_Supplier_Id) === String(inspectorSupplierId)) || sortedQuotations[0];
  }, [sortedQuotations, inspectorSupplierId]);

  // Award PO to a specific single supplier
  const handleAwardPO = async (quotationId, supplierName) => {
    if (window.confirm(`Accept price quote from ${supplierName} and issue official Purchase Order?`)) {
      try {
        const quo = quotations.find(q => Number(q.int_Quotation_Id) === Number(quotationId));
        const finalTotal = Number(quo?.dec_Total_Amount || quo?.grandTotal || 0) + Number(quo?.dec_Transport_Cost || quo?.transport || 0);
        const poData = {
          int_Quotation_Id: quotationId,
          int_Request_Id: quo?.int_Request_Id || currentReq?.int_Request_Id,
          int_Supplier_Id: quo?.int_Supplier_Id || 1,
          int_Store_Id: currentReq?.int_Store_Id || 1,
          dbl_Total_Amount: finalTotal > 0 ? finalTotal : 5000,
          txt_Status: 'PO Issued',
          txt_Created_By: activeUser,
          txt_Updated_By: activeUser
        };
        try {
          await apiService.savePurchase(poData);
        } catch (e) {
          await mockApi.approveQuotationAndGeneratePO(quotationId);
        }

        // Update requirement status in backend database
        if (currentReq?.int_Request_Id && updateRequestStatus) {
          try {
            await updateRequestStatus(currentReq.int_Request_Id, 'PO Issued', `Purchase Order issued to ${supplierName}`);
          } catch (e) {}
        }

        showToast(`Price quote accepted! Order sent to ${supplierName} for delivery.`, 'success');
        await refreshAll();
      } catch (err) {
        console.error("Error approving quotation:", err);
        showToast("Failed to place Purchase Order", "error");
      }
    }
  };

  // Award Split PO across multiple suppliers (Item-wise L1)
  const handleAwardSplitPO = async () => {
    if (!currentReq || !sortedQuotations || sortedQuotations.length === 0) return;

    if (!window.confirm("Split order between suppliers based on item-wise lowest price (Item L1)? System will create separate Purchase Orders for each supplier.")) {
      return;
    }

    try {
      const supplierItemMap = new Map();

      (currentReq.items || []).forEach(reqItem => {
        const reqPId = Number(reqItem.int_Product_Id || reqItem.int_Item_Id);
        let bestQuote = null;
        let lowestPrice = Infinity;

        sortedQuotations.forEach(q => {
          const qItem = q.items?.find(i => Number(i.int_Product_Id || i.int_Item_Id) === reqPId);
          const price = Number(qItem?.dec_Unit_Price ?? qItem?.dbl_Unit_Price ?? qItem?.unit_price ?? 0);
          const isAvail = qItem && qItem.is_available !== false && qItem.txt_Status !== 'Not Available' && price > 0;

          if (isAvail && price < lowestPrice) {
            lowestPrice = price;
            bestQuote = q;
          }
        });

        if (bestQuote) {
          const sId = bestQuote.int_Supplier_Id;
          const reqQty = Number(reqItem.dec_Required_Qty || reqItem.int_Requested_Quantity || reqItem.int_Quantity || reqItem.quantity || 1);
          const lineTotal = lowestPrice * reqQty;

          if (!supplierItemMap.has(sId)) {
            supplierItemMap.set(sId, {
              supplierId: sId,
              supplierName: bestQuote.supplierName,
              quotationId: bestQuote.int_Quotation_Id,
              items: [reqItem],
              totalAmount: lineTotal + Number(bestQuote.transport || 0)
            });
          } else {
            const existing = supplierItemMap.get(sId);
            existing.items.push(reqItem);
            existing.totalAmount += lineTotal;
          }
        }
      });

      if (supplierItemMap.size === 0) {
        showToast("No valid supplier price quotes available for item split.", "error");
        return;
      }

      let poCount = 0;
      const supplierNames = [];

      for (const [sId, group] of supplierItemMap.entries()) {
        const poData = {
          int_Quotation_Id: group.quotationId,
          int_Request_Id: currentReq.int_Request_Id,
          int_Supplier_Id: sId,
          int_Store_Id: currentReq.int_Store_Id || 1,
          dbl_Total_Amount: group.totalAmount,
          txt_Status: 'PO Issued',
          txt_Created_By: activeUser,
          txt_Updated_By: activeUser
        };

        try {
          await apiService.savePurchase(poData);
        } catch (e) {
          await mockApi.approveQuotationAndGeneratePO(group.quotationId);
        }
        poCount++;
        supplierNames.push(group.supplierName);
      }

      if (currentReq?.int_Request_Id && updateRequestStatus) {
        try {
          await updateRequestStatus(currentReq.int_Request_Id, 'PO Issued', `Split Purchase Orders issued across ${poCount} suppliers`);
        } catch (e) {}
      }

      showToast(`Split Orders Placed! ${poCount} Purchase Orders issued to: ${supplierNames.join(', ')}.`, 'success');
      await refreshAll();
    } catch (err) {
      console.error("Error creating split purchase orders:", err);
      showToast("Failed to create split purchase orders", "error");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to reject and delete this request from database?")) {
      try {
        await apiService.deleteRequest(requestId);
        showToast("Request rejected and removed!", "info");
        await refreshAll();
      } catch (err) {
        showToast("Failed to delete request", "error");
      }
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Compare Price Quotes & Award Orders
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '3px', margin: 0 }}>
            Review supplier bids, evaluate item-wise prices, and issue Purchase Orders to the lowest bidder (L1).
          </p>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Row: Requirement Status Tabs & Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-bg-secondary, #f1f5f9)', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${filterTab === 'OPEN' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterTab('OPEN')}
                style={{ borderRadius: '6px', fontWeight: 600, border: 'none' }}
              >
                Open Bids ({requests.filter(r => !['approved','po issued','delivered','completed','rejected'].includes((r.txt_Status||'').toLowerCase())).length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterTab === 'AWARDED' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterTab('AWARDED')}
                style={{ borderRadius: '6px', fontWeight: 600, border: 'none' }}
              >
                Awarded Orders
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterTab('ALL')}
                style={{ borderRadius: '6px', fontWeight: 600, border: 'none' }}
              >
                All Requirements ({requests.length})
              </button>
            </div>

            {/* Requirement Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '520px', minWidth: '280px' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.875rem' }}>
                Select Requirement:
              </label>
              <select
                className="form-select"
                style={{ fontWeight: 600, fontSize: '0.875rem', width: '100%' }}
                value={selectedReqId}
                onChange={e => setSelectedReqId(Number(e.target.value))}
              >
                {filteredRequests.length === 0 ? (
                  <option value="">No matching requirements found</option>
                ) : (
                  filteredRequests.map(req => {
                    const qCount = quotations.filter(q => Number(q.int_Request_Id) === Number(req.int_Request_Id)).length;
                    return (
                      <option key={req.int_Request_Id} value={req.int_Request_Id}>
                        {req.txt_Request_No || `REQ-${req.int_Request_Id}`} — ({req.txt_Month || 'Requirement'} {req.int_Year || 2026} | Est. ₹{Number(req.dec_Budget || 0).toLocaleString('en-IN')} | {qCount} Bids)
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {currentReq && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={currentReq.txt_Status} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRejectRequest(currentReq.int_Request_Id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px' }}
                  title="Delete requirement record from database"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar for Selected Requirement */}
          {currentReq && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px dashed var(--color-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-primary)', padding: '8px', borderRadius: '8px' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Requirement Code</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>{currentReq.txt_Request_No || `REQ-${currentReq.int_Request_Id}`}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '8px', borderRadius: '8px' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Requested Items</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{currentReq.items?.length || 0} Products</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', padding: '8px', borderRadius: '8px' }}>
                  <GitCompare size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Supplier Bids</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9333ea' }}>{reqQuotations.length} Quotes Submitted</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#b45309', padding: '8px', borderRadius: '8px' }}>
                  <Trophy size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Lowest Bid (L1)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: optimumQuotation ? '#047857' : 'var(--color-text-secondary)' }}>
                    {optimumQuotation ? `₹${optimumQuotation.grandTotal.toLocaleString('en-IN')}` : 'No Bids'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!currentReq ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--color-success-text)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Requirements Found</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '500px', margin: '6px auto 0' }}>
            There are currently no requirements matching your filter criteria. Switch to "All Requirements" or check back later when store managers raise new requirements.
          </p>
        </div>
      ) : reqQuotations.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <GitCompare size={44} color="var(--color-text-muted)" style={{ marginBottom: '14px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>No Supplier Quotes Received Yet</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '520px', margin: '6px auto 0' }}>
            Registered suppliers have been notified for <strong>{currentReq.txt_Request_No}</strong>. As soon as suppliers submit their price bids in their portal, they will automatically appear here for real-time comparison.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overall Lowest Price (L1) Recommendation Card */}
          {optimumQuotation && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid #34d399',
              borderRadius: '14px',
              padding: '20px 24px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 8px rgba(5, 150, 105, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Trophy size={32} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        backgroundColor: '#059669',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                      }}>
                        🏆 System Recommended Lowest Price (L1)
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', backgroundColor: '#a7f3d0', padding: '2px 8px', borderRadius: '10px' }}>
                        Item Coverage: {optimumQuotation.availableItemsCount}/{optimumQuotation.totalReqItems} ({optimumQuotation.coveragePercent}%)
                      </span>
                    </div>

                    <h3 style={{ margin: '6px 0 3px 0', fontSize: '1.25rem', fontWeight: 800, color: '#064e3b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {optimumQuotation.supplierName}
                      {optimumQuotation.ownerName && (
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#047857' }}>
                          (Proprietor: {optimumQuotation.ownerName})
                        </span>
                      )}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8125rem', color: '#047857', marginTop: '4px' }}>
                      {optimumQuotation.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Phone size={14} /> {optimumQuotation.phone}
                        </span>
                      )}
                      {optimumQuotation.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={14} /> {optimumQuotation.email}
                        </span>
                      )}
                      {optimumQuotation.gst && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontFamily: 'monospace' }}>
                          <FileText size={14} /> GST: {optimumQuotation.gst}
                        </span>
                      )}
                      {optimumQuotation.rating > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#b45309' }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b" /> {optimumQuotation.rating.toFixed(1)} / 5.0
                        </span>
                      )}
                    </div>

                    <div style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#047857' }}>
                      Total Bid Price: <strong style={{ color: '#064e3b', fontSize: '1.1rem' }}>₹{optimumQuotation.grandTotal.toLocaleString('en-IN')}</strong>
                      <span style={{ opacity: 0.9, marginLeft: '8px', fontSize: '0.825rem' }}>
                        (Products: ₹{optimumQuotation.itemsSubtotal.toLocaleString('en-IN')} + Freight: ₹{optimumQuotation.transport.toLocaleString('en-IN')} | Turnaround: {optimumQuotation.deliveryDays})
                      </span>
                      {costSavings > 0 && (
                        <span style={{ fontWeight: 800, color: '#047857', backgroundColor: '#6ee7b7', padding: '2px 8px', borderRadius: '6px', marginLeft: '10px', fontSize: '0.8rem' }}>
                          Save ₹{costSavings.toLocaleString('en-IN')}!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {isOrderPlaced || optimumQuotation.txt_Status === 'Approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 800, fontSize: '1rem', backgroundColor: '#a7f3d0', padding: '8px 16px', borderRadius: '8px' }}>
                      <CheckCircle2 size={22} /> Order Awarded & PO Issued
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => handleAwardPO(optimumQuotation.int_Quotation_Id, optimumQuotation.supplierName)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', fontWeight: 800, fontSize: '0.9rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)' }}
                      >
                        <ShoppingCart size={18} /> Accept Recommended Quote (L1)
                      </button>
                      {sortedQuotations.length > 1 && (
                        <button
                          className="btn btn-primary"
                          onClick={handleAwardSplitPO}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', fontWeight: 800, fontSize: '0.9rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px' }}
                          title="Split order across multiple suppliers based on item-wise lowest price (Item L1)"
                        >
                          <Award size={18} /> Split Order (Item L1)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* View Mode Switcher Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('cards')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '8px 16px' }}
              >
                <Layers size={16} /> Supplier Bids ({sortedQuotations.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('matrix')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '8px 16px' }}
              >
                <GitCompare size={16} /> Item Price Matrix
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'inspector' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('inspector')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '8px 16px' }}
              >
                <FileText size={16} /> Quote Inspector
              </button>
            </div>
          </div>

          {/* MODE 1: SUPPLIER BID CARDS GRID */}
          {viewMode === 'cards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {sortedQuotations.map((q, rankIdx) => {
                const isL1 = rankIdx === 0;
                return (
                  <div
                    key={q.int_Quotation_Id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      border: isL1 ? '2px solid #059669' : '1px solid var(--color-border)',
                      boxShadow: isL1 ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'var(--shadow-sm)'
                    }}
                  >
                    {/* Supplier Header */}
                    <div style={{
                      padding: '14px 18px',
                      backgroundColor: isL1 ? '#ecfdf5' : 'var(--color-bg-secondary, #f8fafc)',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            backgroundColor: isL1 ? '#059669' : '#64748b',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            {isL1 ? 'L1 Lowest Bid' : `Rank #${rankIdx + 1}`}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-purple-text)' }}>
                            {q.txt_Quotation_No || `QTN-${q.int_Quotation_Id}`}
                          </span>
                        </div>
                        <h4 style={{ margin: '4px 0 0 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                          {q.supplierName}
                        </h4>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isL1 ? '#047857' : 'var(--color-text-primary)' }}>
                          ₹{q.grandTotal.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                          Inc. ₹{q.transport} freight
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div style={{ padding: '12px 18px', fontSize: '0.8rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--color-surface)' }}>
                      {q.ownerName && <div><strong>Proprietor:</strong> {q.ownerName}</div>}
                      {q.phone && <div><strong>Phone:</strong> {q.phone}</div>}
                      {q.gst && <div><strong>GSTIN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{q.gst}</span></div>}
                      <div><strong>Turnaround:</strong> {q.deliveryDays}</div>
                    </div>

                    {/* Items Breakdown List */}
                    <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        Quoted Products ({q.availableItemsCount}/{q.totalReqItems})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                        {(currentReq?.items || []).map((reqItem, idx) => {
                          const reqPId = Number(reqItem.int_Product_Id || reqItem.int_Item_Id);
                          const qItem = q.items?.find(i => Number(i.int_Product_Id || i.int_Item_Id) === reqPId);
                          const price = Number(qItem?.dec_Unit_Price ?? qItem?.dbl_Unit_Price ?? qItem?.unit_price ?? 0);
                          const isAvail = qItem && qItem.is_available !== false && qItem.txt_Status !== 'Not Available' && price > 0;
                          const reqQty = Number(reqItem.dec_Required_Qty || reqItem.int_Requested_Quantity || reqItem.int_Quantity || reqItem.quantity || 1);

                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 6px', backgroundColor: 'var(--color-bg-secondary, #f8fafc)', borderRadius: '6px' }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{reqItem.product_name || reqItem.txt_Item_Name}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                                  ({reqQty} {reqItem.unit || 'Pcs'})
                                </span>
                              </div>
                              <div>
                                {isAvail ? (
                                  <strong style={{ color: 'var(--color-text-primary)' }}>₹{price.toFixed(2)}/unit</strong>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>Out of Stock</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Action */}
                    <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-bg-secondary, #f8fafc)', borderTop: '1px solid var(--color-border)' }}>
                      {isOrderPlaced || q.txt_Status === 'Approved' ? (
                        <div style={{ textAlign: 'center', color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
                          ✓ Order Issued to Supplier
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={isL1 ? "btn btn-success" : "btn btn-secondary"}
                          onClick={() => handleAwardPO(q.int_Quotation_Id, q.supplierName)}
                          style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                        >
                          Accept {q.supplierName}'s Bid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 2: ITEM-BY-ITEM COMPARISON MATRIX */}
          {viewMode === 'matrix' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', backgroundColor: 'var(--color-bg-secondary, #f8fafc)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Item-by-Item Price Matrix</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {sortedQuotations.length} Bidding Supplier(s)
                </span>
              </div>

              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '220px', backgroundColor: '#f8fafc', padding: '14px 16px', verticalAlign: 'top' }}>Requested Product</th>
                      {sortedQuotations.map((q, idx) => {
                        const isL1 = idx === 0;
                        return (
                          <th 
                            key={q.int_Quotation_Id} 
                            style={{ 
                              textAlign: 'center', 
                              minWidth: '200px',
                              backgroundColor: isL1 ? '#ecfdf5' : '#ffffff',
                              padding: '14px 16px',
                              borderLeft: '1px solid var(--color-border)',
                              verticalAlign: 'top'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              {isL1 && (
                                <span style={{ backgroundColor: '#059669', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                                  L1 Recommended
                                </span>
                              )}
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                                {q.supplierName}
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-purple-text)', backgroundColor: '#f3e8ff', padding: '1px 8px', borderRadius: '4px' }}>
                                {q.txt_Quotation_No || `QTN-${q.int_Quotation_Id}`}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {/* Item lines */}
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
                                    {isLowestPrice && (
                                      <span style={{ fontSize: '0.65rem', backgroundColor: '#6ee7b7', color: '#064e3b', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                                        Lowest Item L1
                                      </span>
                                    )}
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

                    {/* Subtotal */}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                      <td style={{ padding: '10px 16px' }}>Products Subtotal</td>
                      {sortedQuotations.map(q => (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)' }}>
                          ₹{Number(q.itemsSubtotal || 0).toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* Freight */}
                    <tr>
                      <td style={{ padding: '10px 16px' }}>Freight / Transport</td>
                      {sortedQuotations.map(q => (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)' }}>
                          ₹{Number(q.transport || 0).toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* Delivery Time */}
                    <tr>
                      <td style={{ padding: '10px 16px' }}>Delivery Turnaround</td>
                      {sortedQuotations.map(q => (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '10px 16px', borderLeft: '1px solid var(--color-border)', fontWeight: 600 }}>
                          {q.deliveryDays}
                        </td>
                      ))}
                    </tr>

                    {/* Grand Total */}
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 800, fontSize: '0.95rem' }}>
                      <td style={{ padding: '12px 16px' }}>Grand Total</td>
                      {sortedQuotations.map((q, idx) => (
                        <td 
                          key={q.int_Quotation_Id} 
                          style={{ 
                            textAlign: 'center', 
                            padding: '12px 16px',
                            borderLeft: '1px solid var(--color-border)',
                            color: idx === 0 ? '#047857' : 'var(--color-text-primary)',
                            fontSize: '1.05rem'
                          }}
                        >
                          ₹{Number(q.grandTotal || 0).toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* Action */}
                    <tr>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>Action</td>
                      {sortedQuotations.map((q, idx) => (
                        <td key={q.int_Quotation_Id} style={{ textAlign: 'center', padding: '14px 16px', borderLeft: '1px solid var(--color-border)' }}>
                          {isOrderPlaced || q.txt_Status === 'Approved' ? (
                            <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
                              PO Issued
                            </span>
                          ) : (
                            <button
                              className={idx === 0 ? "btn btn-success btn-sm" : "btn btn-secondary btn-sm"}
                              onClick={() => handleAwardPO(q.int_Quotation_Id, q.supplierName)}
                              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                            >
                              Accept Quote
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Matrix Table Pagination */}
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
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Showing <strong>{totalReqItems > 0 ? itemsStartIndex + 1 : 0} - {Math.min(itemsStartIndex + itemsPageSize, totalReqItems)}</strong> of <strong>{totalReqItems}</strong> products
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={itemsPage === 1}
                    onClick={() => setItemsPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', padding: '0 8px' }}>
                    Page <strong>{itemsPage}</strong> of <strong>{itemsTotalPages}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={itemsPage === itemsTotalPages}
                    onClick={() => setItemsPage(prev => Math.min(prev + 1, itemsTotalPages))}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: INDIVIDUAL QUOTE INSPECTOR */}
          {viewMode === 'inspector' && activeInspectorQuote && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Inspect Supplier Bid:</label>
                  <select
                    className="form-select"
                    style={{ minWidth: '260px', fontWeight: 600 }}
                    value={inspectorSupplierId || activeInspectorQuote.int_Supplier_Id}
                    onChange={e => setInspectorSupplierId(e.target.value)}
                  >
                    {sortedQuotations.map((q, idx) => (
                      <option key={q.int_Quotation_Id} value={q.int_Supplier_Id}>
                        {q.supplierName} ({idx === 0 ? 'L1 Recommended — ' : ''}₹{q.grandTotal.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                {!isOrderPlaced && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleAwardPO(activeInspectorQuote.int_Quotation_Id, activeInspectorQuote.supplierName)}
                    style={{ fontWeight: 800 }}
                  >
                    Accept {activeInspectorQuote.supplierName}'s Quote
                  </button>
                )}
              </div>

              {/* Inspector Detailed Sheet */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px', backgroundColor: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{activeInspectorQuote.supplierName}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Quotation Code: <strong>{activeInspectorQuote.txt_Quotation_No || `QTN-${activeInspectorQuote.int_Quotation_Id}`}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                      ₹{activeInspectorQuote.grandTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      Turnaround: {activeInspectorQuote.deliveryDays}
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Req Qty</th>
                      <th>Quoted Unit Price</th>
                      <th>Subtotal</th>
                      <th>Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReq?.items || []).map((reqItem, idx) => {
                      const reqPId = Number(reqItem.int_Product_Id || reqItem.int_Item_Id);
                      const qItem = activeInspectorQuote.items?.find(i => Number(i.int_Product_Id || i.int_Item_Id) === reqPId);
                      const price = Number(qItem?.dec_Unit_Price ?? qItem?.dbl_Unit_Price ?? qItem?.unit_price ?? 0);
                      const isAvail = qItem && qItem.is_available !== false && qItem.txt_Status !== 'Not Available' && price > 0;
                      const reqQty = Number(reqItem.dec_Required_Qty || reqItem.int_Requested_Quantity || reqItem.int_Quantity || reqItem.quantity || 1);

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{reqItem.product_name || reqItem.txt_Item_Name}</td>
                          <td>{reqQty} {reqItem.unit || 'Pcs'}</td>
                          <td>{isAvail ? `₹${price.toFixed(2)}` : '—'}</td>
                          <td style={{ fontWeight: 700 }}>{isAvail ? `₹${(price * reqQty).toLocaleString('en-IN')}` : '—'}</td>
                          <td>
                            {isAvail ? (
                              <span style={{ color: '#059669', fontWeight: 700 }}>Available</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 700 }}>Out of Stock</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
