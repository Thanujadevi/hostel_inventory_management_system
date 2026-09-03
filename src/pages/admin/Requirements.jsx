import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { matchesWordPrefix } from '../../utils/searchUtils';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Send, 
  Eye, 
  Clock, 
  Calendar, 
  Lock, 
  Unlock, 
  Settings, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Package,
  Layers,
  Printer,
  Building2,
  Filter,
  Search,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

export const AdminRequirements = ({ currentTab }) => {
  const { 
    requests, 
    items, 
    purchases,
    stores,
    categories,
    requirementPeriod, 
    saveRequirementPeriod, 
    togglePeriodStatus, 
    isRequirementWindowActive,
    refreshAll, 
    updateRequestStatus,
    deleteRequest,
    apiService, 
    showToast 
  } = useData();

  const getSubTab = (tabStr) => {
    if (typeof tabStr === 'string' && tabStr.includes(':')) {
      return tabStr.split(':')[1];
    }
    return 'window';
  };

  const [activeTab, setActiveTab] = useState(() => getSubTab(currentTab));

  useEffect(() => {
    if (typeof currentTab === 'string' && currentTab.includes(':')) {
      const sub = currentTab.split(':')[1];
      if (sub) {
        setActiveTab(sub);
      }
    }
  }, [currentTab]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPrintIndentOpen, setIsPrintIndentOpen] = useState(false);

  // Pagination states (5 items per page)
  const [catPage, setCatPage] = useState(1);
  const [conSolPage, setConSolPage] = useState(1);

  // Consolidation Filter State
  const [conSolSearch, setConSolSearch] = useState('');
  const [conSolStatusFilter, setConSolStatusFilter] = useState('ACCEPTED'); // 'ACCEPTED' | 'PENDING' | 'ALL'
  const [conSolStoreFilter, setConSolStoreFilter] = useState('ALL');
  const [conSolCategoryFilter, setConSolCategoryFilter] = useState('ALL');
  const [selectedConsolProduct, setSelectedConsolProduct] = useState(null);

  // Period Form State
  const [periodForm, setPeriodForm] = useState({
    txt_Title: '',
    txt_Month: 'August',
    int_Year: 2026,
    dte_Start_Date: '',
    dte_Deadline: '',
    txt_Instructions: '',
    arr_Active_Item_Ids: []
  });

  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (requirementPeriod) {
      setPeriodForm({
        txt_Title: requirementPeriod.txt_Title || 'August 2026 Monthly Hostel Requirement Period',
        txt_Month: requirementPeriod.txt_Month || 'August',
        int_Year: requirementPeriod.int_Year || 2026,
        dte_Start_Date: requirementPeriod.dte_Start_Date || new Date().toISOString().slice(0, 16),
        dte_Deadline: requirementPeriod.dte_Deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        txt_Instructions: requirementPeriod.txt_Instructions || 'Please inspect hostel inventory stock levels and submit monthly requirements before the deadline.',
        arr_Active_Item_Ids: requirementPeriod.arr_Active_Item_Ids || items.map(i => i.int_Item_Id)
      });
    } else if (items.length > 0) {
      setPeriodForm(prev => ({
        ...prev,
        arr_Active_Item_Ids: items.map(i => i.int_Item_Id)
      }));
    }
  }, [requirementPeriod, items]);

  const windowActive = isRequirementWindowActive();

  const handleOpenConfigModal = () => {
    if (requirementPeriod) {
      setPeriodForm({
        txt_Title: requirementPeriod.txt_Title || '',
        txt_Month: requirementPeriod.txt_Month || 'August',
        int_Year: requirementPeriod.int_Year || 2026,
        dte_Start_Date: requirementPeriod.dte_Start_Date || new Date().toISOString().slice(0, 16),
        dte_Deadline: requirementPeriod.dte_Deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        txt_Instructions: requirementPeriod.txt_Instructions || '',
        arr_Active_Item_Ids: requirementPeriod.arr_Active_Item_Ids || items.map(i => i.int_Item_Id)
      });
    }
    setIsConfigModalOpen(true);
  };

  const handleToggleItemSelection = (itemId) => {
    setPeriodForm(prev => {
      const current = prev.arr_Active_Item_Ids || [];
      if (current.includes(itemId)) {
        return { ...prev, arr_Active_Item_Ids: current.filter(id => id !== itemId) };
      } else {
        return { ...prev, arr_Active_Item_Ids: [...current, itemId] };
      }
    });
  };

  const handleSelectAllItems = () => {
    setPeriodForm(prev => ({
      ...prev,
      arr_Active_Item_Ids: items.map(i => i.int_Item_Id)
    }));
  };

  const handleDeselectAllItems = () => {
    setPeriodForm(prev => ({
      ...prev,
      arr_Active_Item_Ids: []
    }));
  };

  const handleSavePeriodConfig = async (e) => {
    e.preventDefault();
    if (periodForm.arr_Active_Item_Ids.length === 0) {
      if (!window.confirm("You have not selected any catalogue items for stores. Are you sure you want to open this window without items?")) {
        return;
      }
    }
    await saveRequirementPeriod({
      ...periodForm,
      txt_Status: requirementPeriod?.txt_Status || 'OPEN'
    });
    setIsConfigModalOpen(false);
    refreshAll();
  };

  const handleExtendDeadlineHours = async (hours) => {
    if (!requirementPeriod) return;
    const currentDeadline = requirementPeriod.dte_Deadline ? new Date(requirementPeriod.dte_Deadline) : new Date();
    const newDeadline = new Date(currentDeadline.getTime() + hours * 60 * 60 * 1000);
    const formatted = newDeadline.toISOString().slice(0, 16);
    
    await saveRequirementPeriod({
      ...requirementPeriod,
      dte_Deadline: formatted,
      txt_Status: 'OPEN'
    });
    showToast(`Deadline extended by ${hours} hours! (New: ${newDeadline.toLocaleString()})`, 'success');
  };

  const handleOpenDetail = (req) => {
    setSelectedReq(req);
    setAdminRemarks('');
  };

  const handleAccept = async (targetReqId) => {
    const target = typeof targetReqId === 'object' ? targetReqId : selectedReq;
    const reqId = (typeof targetReqId === 'number' || typeof targetReqId === 'string') 
      ? targetReqId 
      : (target?.int_Request_Id || target?.id);

    if (!reqId) {
      showToast("Cannot approve: Missing requirement ID", "error");
      return;
    }

    try {
      await updateRequestStatus(reqId, 'Approved', adminRemarks || 'Verified & Approved by Admin review');
      showToast(`Store Requirement #${target?.txt_Request_No || target?.txt_Request_Code || `REQ-${reqId}`} Verified & Approved!`, 'success');
      setSelectedReq(null);
    } catch (err) {
      console.error("Error approving store requirement:", err);
      showToast("Error approving store requirement", "error");
    }
  };

  const handleReject = async (targetReqId) => {
    const target = typeof targetReqId === 'object' ? targetReqId : selectedReq;
    const reqId = (typeof targetReqId === 'number' || typeof targetReqId === 'string') 
      ? targetReqId 
      : (target?.int_Request_Id || target?.id);

    if (!reqId) {
      showToast("Cannot reject: Missing requirement ID", "error");
      return;
    }

    if (window.confirm("Reject this store requirement?")) {
      try {
        await updateRequestStatus(reqId, 'Rejected', adminRemarks || 'Rejected by Admin review');
        showToast(`Requirement rejected by Admin`, 'info');
        setSelectedReq(null);
      } catch (err) {
        console.error("Error rejecting requirement:", err);
        showToast("Error rejecting requirement", "error");
      }
    }
  };

  const handleDeleteRequest = async (targetReq) => {
    const reqId = typeof targetReq === 'object' ? (targetReq.int_Request_Id || targetReq.id) : targetReq;
    const reqCode = typeof targetReq === 'object' ? (targetReq.txt_Request_No || targetReq.txt_Request_Code || `REQ-${reqId}`) : `REQ-${reqId}`;
    if (window.confirm(`Are you sure you want to delete requirement ${reqCode}?`)) {
      try {
        await deleteRequest(reqId);
        if (selectedReq && (selectedReq.int_Request_Id === reqId || selectedReq.id === reqId)) {
          setSelectedReq(null);
        }
      } catch (err) {
        console.error("Error deleting requirement:", err);
      }
    }
  };

  // Compute product-wise requirement consolidation
  const consolidatedDemands = useMemo(() => {
    const safeRequests = Array.isArray(requests) ? requests : [];
    const safeItems = Array.isArray(items) ? items : [];
    const safePurchases = Array.isArray(purchases) ? purchases : [];

    const targetRequests = safeRequests.filter(req => {
      if (!req) return false;
      const s = String(req.txt_Status || '').toLowerCase();

      // Exclude requests that are already converted into Purchase Orders, delivered, completed, or rejected!
      const isProcessed = ['po issued', 'delivered', 'completed', 'rejected'].includes(s);
      const hasPO = safePurchases.some(p => 
        Number(p.int_Request_Id) === Number(req.int_Request_Id) ||
        String(p.request_no) === String(req.txt_Request_No || req.txt_Request_Code)
      );

      if (isProcessed || hasPO) return false;

      let statusOk = true;
      if (conSolStatusFilter === 'ACCEPTED') {
        statusOk = s.includes('accept') || s.includes('approve') || s.includes('open') || s.includes('verified');
      } else if (conSolStatusFilter === 'PENDING') {
        statusOk = s.includes('pending');
      } else if (conSolStatusFilter === 'REJECTED') {
        statusOk = s.includes('reject');
      }

      let storeOk = true;
      if (conSolStoreFilter !== 'ALL') {
        storeOk = String(req.int_Store_Id) === String(conSolStoreFilter);
      }

      return statusOk && storeOk;
    });

    const productMap = {};

    targetRequests.forEach(req => {
      const itemList = Array.isArray(req.items) ? req.items : [];
      itemList.forEach(reqItem => {
        if (!reqItem) return;
        const prodId = Number(reqItem.int_Product_Id || reqItem.int_Item_Id);
        if (isNaN(prodId) || !prodId) return;

        if (!productMap[prodId]) {
          const masterItem = safeItems.find(i => i && Number(i.int_Item_Id) === prodId);
          const officialUnit = masterItem ? masterItem.txt_Unit : (reqItem.unit || reqItem.txt_Unit || 'Pcs');
          productMap[prodId] = {
            int_Product_Id: prodId,
            product_code: masterItem ? masterItem.txt_Item_Code : (reqItem.product_code || reqItem.txt_Item_Code || `PRD-00${prodId}`),
            product_name: masterItem ? masterItem.txt_Item_Name : (reqItem.product_name || reqItem.txt_Item_Name || `Product #${prodId}`),
            category: masterItem ? (masterItem.txt_Category || masterItem.category || masterItem.txt_Category_Name || 'General') : (reqItem.category || reqItem.txt_Category || reqItem.txt_Category_Name || 'General'),
            unit: officialUnit,
            est_unit_price: masterItem ? Number(masterItem.dec_Last_Purchase_Price || masterItem.dbl_Unit_Price || 0) : 0,
            stock_in_hand: masterItem ? Number(masterItem.int_quantity_in_hand || masterItem.int_Current_Stock || 0) : 0,
            total_required_qty: 0,
            store_breakdown: []
          };
        }

        const qty = Number(reqItem.dec_Required_Qty || reqItem.int_Quantity || reqItem.int_Requested_Quantity || reqItem.quantity || 0);
        productMap[prodId].total_required_qty += qty;
        productMap[prodId].store_breakdown.push({
          request_id: req.int_Request_Id,
          request_no: req.txt_Request_No || req.txt_Request_Code || 'REQ-N/A',
          store_id: req.int_Store_Id,
          store_name: req.store_name || req.txt_Store_Name || 'Hostel Store',
          qty: qty,
          unit: productMap[prodId].unit,
          status: req.txt_Status || 'Pending',
          remarks: reqItem.txt_Remarks || ''
        });
      });
    });

    let list = Object.values(productMap);

    if (conSolCategoryFilter !== 'ALL') {
      list = list.filter(p => p.category === conSolCategoryFilter);
    }

    if (conSolSearch && conSolSearch.trim()) {
      list = list.filter(p => 
        matchesWordPrefix(p.product_name, conSolSearch) ||
        matchesWordPrefix(p.product_code, conSolSearch) ||
        matchesWordPrefix(p.category, conSolSearch)
      );
    }

    return list;
  }, [requests, items, conSolStatusFilter, conSolStoreFilter, conSolCategoryFilter, conSolSearch]);

  useEffect(() => {
    setConSolPage(1);
  }, [conSolSearch, conSolStatusFilter, conSolStoreFilter, conSolCategoryFilter]);

  const totalConsolidatedBudget = consolidatedDemands.reduce((sum, p) => sum + (p.total_required_qty * p.est_unit_price), 0);
  const totalConsolidatedUnits = consolidatedDemands.reduce((sum, p) => sum + p.total_required_qty, 0);

  const handlePrintConsolidatedIndent = () => {
    setIsPrintIndentOpen(true);
  };

  const handleForwardAllConsolidatedToSuppliers = async () => {
    const acceptedReqs = (Array.isArray(requests) ? requests : []).filter(r => r && (r.txt_Status === 'Accepted' || r.txt_Status === 'Approved'));
    if (acceptedReqs.length === 0) {
      showToast("No Accepted store requests available to forward to suppliers.", "info");
      return;
    }
    if (window.confirm(`Forward consolidated requirements from ${acceptedReqs.length} accepted store requests to suppliers for quotation?`)) {
      try {
        for (const req of acceptedReqs) {
          await apiService.updateRequestStatus(req.int_Request_Id, 'Open for Quotation', 'Consolidated batch opened for supplier quotation');
        }
        showToast("Consolidated requirement batch opened for supplier quotations!", "success");
        refreshAll();
      } catch (err) {
        showToast("Error updating request statuses", "error");
      }
    }
  };

  const requestColumns = [
    { header: 'Req No', accessor: 'txt_Request_No', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.txt_Request_No || row.txt_Request_Code || `REQ-${row.int_Request_Id}`}</strong> },
    { header: 'Hostel Store', accessor: 'store_name', render: row => <strong style={{ color: 'var(--color-text-primary)' }}>{row.store_name || row.txt_Store_Name || `Store #${row.int_Store_Id}`}</strong> },
    { header: 'Request Date', accessor: 'dte_Request_Date', render: row => row.dte_Request_Date ? new Date(row.dte_Request_Date).toISOString().split('T')[0] : 'Today' },
    { header: 'Month / Year', accessor: 'txt_Month', render: row => `${row.txt_Month || 'August'} ${row.int_Year || 2026}` },
    { header: 'Est. Budget', accessor: 'dec_Budget', render: row => {
      const b = Number(row.dec_Budget || row.items?.reduce((sum, i) => sum + (Number(i.dec_Required_Qty || i.int_Requested_Quantity || i.int_Quantity || i.quantity || 0) * Number(i.dec_Last_Purchase_Price || i.dbl_Unit_Price || 50)), 0) || 0);
      return <span style={{ fontWeight: 700 }}>₹{b.toLocaleString('en-IN')}</span>;
    }},
    { header: 'Status', accessor: 'txt_Status', render: row => {
      const linkedPO = (purchases || []).find(p => 
        Number(p.int_Request_Id) === Number(row.int_Request_Id) ||
        String(p.request_no) === String(row.txt_Request_No || row.txt_Request_Code)
      );
      const effectiveStatus = linkedPO ? (linkedPO.txt_Status || 'PO Issued') : row.txt_Status;
      return <StatusBadge status={effectiveStatus} />;
    }},
    { header: 'Actions', render: row => (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenDetail(row)}>
          <Eye size={14} /> Review Details
        </button>
        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteRequest(row)} title="Delete Requirement" style={{ color: 'var(--color-danger-text)', padding: '6px 10px' }}>
          <Trash2 size={14} />
        </button>
      </div>
    )}
  ];

  const filteredCatalogItems = (Array.isArray(items) ? items : []).filter(item => {
    const itemCat = item.txt_Category || item.txt_Category_Name || '';
    const matchesSearch = matchesWordPrefix(item.txt_Item_Name, catalogueSearch) ||
                          matchesWordPrefix(item.txt_Item_Code, catalogueSearch) ||
                          matchesWordPrefix(itemCat, catalogueSearch);
    const matchesCat = selectedCategoryFilter === 'ALL' || itemCat === selectedCategoryFilter || item.txt_Category_Name === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  useEffect(() => {
    setCatPage(1);
  }, [catalogueSearch, selectedCategoryFilter]);

  const pendingRequestsCount = (Array.isArray(requests) ? requests : []).filter(r => r && r.txt_Status === 'Pending').length;
  const acceptedRequestsCount = (Array.isArray(requests) ? requests : []).filter(r => r && (r.txt_Status === 'Accepted' || r.txt_Status === 'Approved' || r.txt_Status === 'Open for Quotation')).length;
  const activeValidCount = (Array.isArray(items) ? items : []).filter(i => i && (periodForm.arr_Active_Item_Ids || []).includes(i.int_Item_Id)).length;

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
            Store Requirements & Demand Consolidation
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Review hostel store requests, aggregate product demands, and authorize catalogue items for active procurement periods.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {requirementPeriod?.txt_Status === 'OPEN' ? (
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => togglePeriodStatus('CLOSED')}
            >
              <Lock size={15} /> Close Window
            </button>
          ) : (
            <button 
              className="btn btn-success btn-sm"
              onClick={() => togglePeriodStatus('OPEN')}
            >
              <Unlock size={15} /> Open Window
            </button>
          )}

          <button className="btn btn-primary btn-sm" onClick={handleOpenConfigModal}>
            <Settings size={15} /> Period & Catalogue Settings
          </button>
        </div>
      </div>

      {/* Uncluttered Requirement Status Bar */}
      <div 
        style={{ 
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: `5px solid ${windowActive ? 'var(--color-success)' : 'var(--color-primary)'}`,
          borderRadius: 'var(--border-radius)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <StatusBadge status={windowActive ? 'Window Open' : 'Window Closed'} />
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
              {requirementPeriod?.txt_Title || 'Monthly Inventory Procurement Window'}
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginLeft: '12px' }}>
              Target: {requirementPeriod?.txt_Month || 'August'} {requirementPeriod?.int_Year || 2026}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Deadline: </span>
            <strong style={{ color: windowActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
              {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
            </strong>
          </div>

          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '20px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Active Items: </span>
            <strong style={{ color: 'var(--color-primary)' }}>{activeValidCount} / {items.length} Items</strong>
          </div>
        </div>
      </div>



      {/* Main Tabs Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'window' ? 'active' : ''}`}
          onClick={() => setActiveTab('window')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Settings size={18} /> Request Window & Items
        </button>

        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FileText size={18} /> Received Hostel Requests
          {pendingRequestsCount > 0 && (
            <span style={{
              background: 'var(--color-danger)',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'consolidation' ? 'active' : ''}`}
          onClick={() => setActiveTab('consolidation')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Layers size={18} /> Total Items Requested
          <span style={{
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {consolidatedDemands.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CONSOLIDATED PRODUCT DEMANDS */}
      {activeTab === 'consolidation' && (
        <div>
          {/* Clean Filter Toolbar */}
          <div className="filter-bar">
            <div className="filter-group">
              {/* Search Box */}
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search product code or name..."
                  value={conSolSearch}
                  onChange={e => setConSolSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="form-select"
                style={{ width: '200px' }}
                value={conSolStatusFilter}
                onChange={e => setConSolStatusFilter(e.target.value)}
              >
                <option value="ACCEPTED">Accepted Requests (Default)</option>
                <option value="PENDING">Pending Requests</option>
                <option value="ALL">All Store Requests</option>
              </select>

              {/* Hostel Store Filter */}
              <select
                className="form-select"
                style={{ width: '200px' }}
                value={conSolStoreFilter}
                onChange={e => setConSolStoreFilter(e.target.value)}
              >
                <option value="ALL">All Hostel Stores</option>
                {(Array.isArray(stores) ? stores : []).map(s => (
                  <option key={s.int_Store_Id} value={s.int_Store_Id}>{s.txt_Store_Name}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                className="form-select"
                style={{ width: '190px' }}
                value={conSolCategoryFilter}
                onChange={e => setConSolCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {(Array.isArray(categories) ? categories : []).map(c => (
                  <option key={c.int_Category_Id || c.txt_Category_Name} value={c.txt_Category_Name}>{c.txt_Category_Name}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handlePrintConsolidatedIndent}>
                <Printer size={15} /> Print / Export List
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleForwardAllConsolidatedToSuppliers}>
                <Send size={15} /> Send to Suppliers for Quotes
              </button>
            </div>
          </div>

          {/* Consolidated Table (Uncluttered 8-column layout) */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Consolidated Demand</th>
                  <th style={{ textAlign: 'center' }}>Requesting Stores</th>
                  <th style={{ textAlign: 'center' }}>Central Stock</th>
                  <th>Shortfall Status</th>
                  <th style={{ textAlign: 'right' }}>Est. Total Budget</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedDemands.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '36px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>No matches found</div>
                    </td>
                  </tr>
                ) : (
                  consolidatedDemands.slice((conSolPage - 1) * 5, conSolPage * 5).map((prod, idx) => {
                    const realIdx = (conSolPage - 1) * 5 + idx + 1;
                    const shortfall = Math.max(0, prod.total_required_qty - prod.stock_in_hand);
                    const estTotal = prod.total_required_qty * prod.est_unit_price;

                    return (
                      <tr key={prod.int_Product_Id || idx}>
                        <td>{realIdx}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{prod.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{prod.product_code}</div>
                        </td>
                        <td>
                          <span className="category-badge">
                            {prod.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            background: 'var(--color-primary-light)', 
                            color: 'var(--color-primary)', 
                            fontWeight: 800, 
                            fontSize: '0.95rem',
                            padding: '4px 10px',
                            borderRadius: '6px'
                          }}>
                            {prod.total_required_qty} {prod.unit}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="store-chip"
                            onClick={() => setSelectedConsolProduct(prod)}
                            title="Click to view hostel store breakdown"
                          >
                            <Building2 size={13} /> {prod.store_breakdown.length} Hostel {prod.store_breakdown.length === 1 ? 'Store' : 'Stores'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>
                          {prod.stock_in_hand} {prod.unit}
                        </td>
                        <td>
                          {shortfall > 0 ? (
                            <span className="shortfall-pill needed">
                              <AlertCircle size={13} /> {shortfall} {prod.unit} Shortfall
                            </span>
                          ) : (
                            <span className="shortfall-pill ok">
                              <CheckCircle size={13} /> Stock Sufficient
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                          ₹{Number(estTotal).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedConsolProduct(prod)}
                          >
                            <Eye size={14} /> Breakdown
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Consolidated Pagination Bar */}
          {Math.ceil(consolidatedDemands.length / 5) > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Page <strong>{conSolPage}</strong> of <strong>{Math.ceil(consolidatedDemands.length / 5)}</strong>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={conSolPage === 1}
                  onClick={() => setConSolPage(prev => Math.max(prev - 1, 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: conSolPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {Array.from({ length: Math.ceil(consolidatedDemands.length / 5) }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn btn-sm ${conSolPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setConSolPage(pageNum)}
                    style={{ minWidth: '32px', padding: '4px 8px' }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={conSolPage === Math.ceil(consolidatedDemands.length / 5)}
                  onClick={() => setConSolPage(prev => Math.min(prev + 1, Math.ceil(consolidatedDemands.length / 5)))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: conSolPage === Math.ceil(consolidatedDemands.length / 5) ? 0.5 : 1 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STORE REQUIREMENTS RECEIVED */}
      {activeTab === 'requests' && (
        <div>
          <Table columns={requestColumns} data={requests} searchPlaceholder="Search by requirement number, hostel store, status..." />
        </div>
      )}

      {/* TAB 3: REQUIREMENT WINDOW & CATALOGUE MANAGEMENT */}
      {activeTab === 'window' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Authorized Catalogue Items for Store Requirements</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Stores can only raise demands for items that are checked below during this active period
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSelectAllItems}>
                  <CheckSquare size={14} /> Enable All ({(Array.isArray(items) ? items : []).length})
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleDeselectAllItems}>
                  <Square size={14} /> Disable All
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <input
                type="text"
                className="form-control"
                style={{ width: '280px' }}
                placeholder="Search catalogue items..."
                value={catalogueSearch}
                onChange={e => setCatalogueSearch(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Category:</span>
                <select
                  className="form-select"
                  style={{ width: '220px' }}
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {(Array.isArray(categories) ? categories : []).map(cat => (
                    <option key={cat.int_Category_Id || cat.txt_Category_Name} value={cat.txt_Category_Name}>
                      {cat.txt_Category_Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Allowed</th>
                    <th>Item Code</th>
                    <th>Catalogue Product Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Current Stock (Master)</th>
                    <th>Est. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '36px 16px', fontSize: '0.95rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>No matches found</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Try adjusting your search keyword or category filter</div>
                      </td>
                    </tr>
                  ) : (
                    filteredCatalogItems.slice((catPage - 1) * 5, catPage * 5).map(item => {
                      const isChecked = (periodForm.arr_Active_Item_Ids || []).includes(item.int_Item_Id);
                      const stockQty = (typeof item.int_quantity_in_hand === 'number') ? item.int_quantity_in_hand : (item.int_Stock || 0);
                      const isLowStock = stockQty < 15;
                      const catName = (item.txt_Category && item.txt_Category !== '--') ? item.txt_Category : (item.txt_Category_Name || item.category || 'General');
                      return (
                        <tr key={item.int_Item_Id} style={{ backgroundColor: isChecked ? 'rgba(2, 132, 199, 0.04)' : 'transparent' }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleItemSelection(item.int_Item_Id)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                            />
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.txt_Item_Code}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.txt_Item_Name}</td>
                          <td>
                            <span className="category-badge">
                              {catName}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{item.txt_Unit || 'Pcs'}</td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              backgroundColor: isLowStock ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                              color: isLowStock ? 'var(--color-danger-text)' : 'var(--color-success-text)'
                            }}>
                              {stockQty} {item.txt_Unit || 'Pcs'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>₹{Number(item.dec_Last_Purchase_Price || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Catalogue Pagination Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Page <strong>{catPage}</strong> of <strong>{Math.ceil(filteredCatalogItems.length / 5) || 1}</strong>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={catPage === 1}
                  onClick={() => setCatPage(prev => Math.max(prev - 1, 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: catPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {Array.from({ length: Math.ceil(filteredCatalogItems.length / 5) || 1 }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn btn-sm ${catPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCatPage(pageNum)}
                    style={{ minWidth: '32px', padding: '4px 8px' }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={catPage === (Math.ceil(filteredCatalogItems.length / 5) || 1)}
                  onClick={() => setCatPage(prev => Math.min(prev + 1, Math.ceil(filteredCatalogItems.length / 5) || 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: catPage === (Math.ceil(filteredCatalogItems.length / 5) || 1) ? 0.5 : 1 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {activeValidCount} of {items.length} catalogue items authorized for store requirements
              </span>
              <button className="btn btn-success" onClick={handleSavePeriodConfig}>
                <CheckCircle size={16} /> Save Active Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfigModalOpen(false)}
          title="Configure Requirement Raising Period & Deadline"
          maxWidth="700px"
        >
          <form onSubmit={handleSavePeriodConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Requirement Window Title / Campaign Name</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. August 2026 Monthly Hostel Inventory Procurement"
                value={periodForm.txt_Title}
                onChange={e => setPeriodForm({ ...periodForm, txt_Title: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Month</label>
                <select 
                  className="form-select" 
                  value={periodForm.txt_Month} 
                  onChange={e => setPeriodForm({ ...periodForm, txt_Month: e.target.value })}
                >
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={periodForm.int_Year}
                  onChange={e => setPeriodForm({ ...periodForm, int_Year: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Opening Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  required
                  value={periodForm.dte_Start_Date}
                  onChange={e => setPeriodForm({ ...periodForm, dte_Start_Date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-danger-text)', fontWeight: 700 }}>
                  Deadline Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  required
                  value={periodForm.dte_Deadline}
                  onChange={e => setPeriodForm({ ...periodForm, dte_Deadline: e.target.value })}
                  style={{ border: '2px solid var(--color-primary)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions / Guidelines for Hostel Store Managers</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Enter instructions that store managers will see when raising requirements..."
                value={periodForm.txt_Instructions}
                onChange={e => setPeriodForm({ ...periodForm, txt_Instructions: e.target.value })}
              />
            </div>

            <div style={{ background: 'var(--color-surface-hover)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Catalogue Permissions Summary</strong>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {periodForm.arr_Active_Item_Ids?.length || 0} / {items.length} Items Authorized
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                You can select or deselect individual items directly on the main tab table before saving.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsConfigModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <CheckCircle size={16} /> Save & Update Period
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Store Requirement Review Detail Modal */}
      {selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReq(null)}
          title={`Review Requirement: ${selectedReq.txt_Request_No || selectedReq.txt_Request_Code || `REQ-${selectedReq.int_Request_Id}`} (${selectedReq.store_name || selectedReq.txt_Store_Name || 'Hostel Store'})`}
          maxWidth="750px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--color-surface-hover)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Hostel Store</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedReq.store_name || selectedReq.txt_Store_Name || 'Hostel Store'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Estimated Budget</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                  ₹{Number(selectedReq.dec_Budget || selectedReq.items?.reduce((sum, i) => sum + (Number(i.dec_Required_Qty || i.int_Requested_Quantity || i.int_Quantity || i.quantity || 0) * Number(i.dec_Last_Purchase_Price || i.dbl_Unit_Price || 50)), 0) || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Current Status</span>
                <div><StatusBadge status={selectedReq.txt_Status || 'Pending'} /></div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Requested Items Manifest</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Required Qty</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReq.items || []).map((item, idx) => {
                      const itemCode = item.product_code || item.txt_Item_Code || `PRD-00${item.int_Product_Id || item.int_Item_Id || idx + 1}`;
                      const itemName = item.product_name || item.txt_Item_Name || `Item #${item.int_Item_Id || idx + 1}`;
                      const cat = item.category || item.txt_Category || item.txt_Category_Name || 'General';
                      const brandName = item.brand || item.txt_Brand || 'Standard';
                      const qtyVal = item.dec_Required_Qty ?? item.int_Requested_Quantity ?? item.int_Quantity ?? item.quantity ?? 0;
                      const unitVal = item.unit || item.txt_Unit_Of_Measurement || item.txt_Unit || 'Pcs';
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{itemCode}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{itemName}</td>
                          <td>
                            <span className="category-badge">
                              {cat}
                            </span>
                          </td>
                          <td>{brandName}</td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {qtyVal} {unitVal}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {item.txt_Remarks || item.txt_Reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReq.txt_Remarks && (
              <div style={{ fontSize: '0.85rem', background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', padding: '10px 14px', borderRadius: '6px' }}>
                <strong>Store Note:</strong> {selectedReq.txt_Remarks}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Admin Approval / Remarks</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Enter notes or decision comments..."
                value={adminRemarks}
                onChange={e => setAdminRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-outline-danger" onClick={() => handleDeleteRequest(selectedReq)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} /> Delete Request
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedReq(null)}>Close</button>
                <button className="btn btn-danger" onClick={() => handleReject(selectedReq)}>
                  <XCircle size={16} /> Reject Request
                </button>
                <button className="btn btn-success" onClick={() => handleAccept(selectedReq)}>
                  <CheckCircle size={16} /> Approve Request
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Individual Consolidated Product Store Breakdown Modal */}
      {selectedConsolProduct && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedConsolProduct(null)}
          title={`Consolidated Breakdown: ${selectedConsolProduct.product_name} (${selectedConsolProduct.product_code})`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--color-surface-hover)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total Consolidated Qty</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                  {selectedConsolProduct.total_required_qty} {selectedConsolProduct.unit}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Central Stock</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedConsolProduct.stock_in_hand} {selectedConsolProduct.unit}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Estimated Total Cost</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-success-text)' }}>
                  ₹{(selectedConsolProduct.total_required_qty * selectedConsolProduct.est_unit_price).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Hostel Store Breakdown</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hostel Store Name</th>
                      <th>Request No</th>
                      <th>Status</th>
                      <th>Requested Quantity</th>
                      <th>Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedConsolProduct.store_breakdown.map((sb, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{sb.store_name}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{sb.request_no}</td>
                        <td><StatusBadge status={sb.status} /></td>
                        <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                          {sb.qty} {sb.unit}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {sb.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedConsolProduct(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Consolidated Indent Report Modal */}
      {isPrintIndentOpen && (
        <Modal
          isOpen={isPrintIndentOpen}
          onClose={() => setIsPrintIndentOpen(false)}
          title="Consolidated Requirement Indent Report"
          size="lg"
        >
          <div className="printable-indent-report" style={{ padding: '16px' }}>
            {/* Header section with 2-line summary description */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid var(--color-border)', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Hostel Inventory Management System
              </h2>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                Consolidated Requirement Procurement Indent Report
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, maxWidth: '650px', margin: '0 auto' }}>
                Official consolidated inventory procurement demand aggregated across all hostel stores for <strong>{requirementPeriod?.txt_Month || 'August'} {requirementPeriod?.int_Year || 2026}</strong> cycle.<br />
                Generated on <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong> — Total Budget: <strong>₹{totalConsolidatedBudget.toLocaleString('en-IN')}</strong> across <strong>{totalConsolidatedUnits} total items ({consolidatedDemands.length} products)</strong>.
              </p>
            </div>

            {/* Quick Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--color-bg-secondary, #f8fafc)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Report Date & Time</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Total Products</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{consolidatedDemands.length} Items</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Total Required Quantity</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{totalConsolidatedUnits} Units</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>Est. Total Budget</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-success-text)' }}>₹{totalConsolidatedBudget.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Table */}
            <div className="table-container" style={{ marginBottom: '24px' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-secondary, #f1f5f9)' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'center', width: '40px' }}>#</th>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)' }}>Product Details</th>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)' }}>Category</th>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>Consolidated Qty</th>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'right' }}>Est. Unit Price</th>
                    <th style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'right' }}>Total Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedDemands.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
                        No product requirements match your selected filters.
                      </td>
                    </tr>
                  ) : (
                    consolidatedDemands.map((prod, index) => (
                      <tr key={prod.item_id || index}>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{prod.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Code: {prod.product_code}</div>
                        </td>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)' }}>{prod.category}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {prod.total_required_qty}
                        </td>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>{prod.unit}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'right' }}>₹{Number(prod.est_unit_price || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid var(--color-border)', textAlign: 'right', fontWeight: 700 }}>
                          ₹{(prod.total_required_qty * prod.est_unit_price).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--color-bg-secondary, #f8fafc)', fontWeight: 700 }}>
                    <td colSpan="3" style={{ padding: '10px 12px', border: '1px solid var(--color-border)', textAlign: 'right' }}>Grand Total:</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-primary)', fontSize: '0.9rem' }}>{totalConsolidatedUnits}</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--color-border)' }}>Units</td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--color-border)' }}></td>
                    <td style={{ padding: '10px 12px', border: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-success-text)', fontSize: '0.95rem' }}>₹{totalConsolidatedBudget.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Approval / Signatures Block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px', paddingTop: '16px', borderTop: '1px dashed var(--color-border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <div>
                <div style={{ minHeight: '36px' }}></div>
                <div style={{ borderTop: '1px solid var(--color-text-secondary)', paddingTop: '4px', fontWeight: 600 }}>Prepared By (Store Supervisor)</div>
              </div>
              <div>
                <div style={{ minHeight: '36px' }}></div>
                <div style={{ borderTop: '1px solid var(--color-text-secondary)', paddingTop: '4px', fontWeight: 600 }}>Verified By (Hostel Warden)</div>
              </div>
              <div>
                <div style={{ minHeight: '36px' }}></div>
                <div style={{ borderTop: '1px solid var(--color-text-secondary)', paddingTop: '4px', fontWeight: 600 }}>Approved By (Chief Warden / Admin)</div>
              </div>
            </div>

            {/* Actions Bar (No Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-secondary" onClick={() => setIsPrintIndentOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} /> Print / Export PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
