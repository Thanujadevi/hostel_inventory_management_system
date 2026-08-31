import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { Plus, Trash2, Send, Calculator, ShoppingBag, Lock, Unlock, Clock, AlertTriangle, Search, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateRequestCode } from '../../utils/codeGenerator';
import { matchesWordPrefix } from '../../utils/searchUtils';

export const StoreRaiseRequirement = ({ setCurrentTab }) => {
  const { currentStore, user } = useAuth();
  const { 
    requests, 
    items, 
    categories,
    requirementPeriod, 
    isRequirementWindowActive, 
    mockApi, 
    showToast, 
    refreshAll 
  } = useData();

  const autoReqCode = generateRequestCode(requests);
  const windowActive = isRequirementWindowActive();

  // Filter catalogue items allowed by admin for this period
  const activeItemIds = requirementPeriod?.arr_Active_Item_Ids || items.map(i => i.int_Item_Id);
  const availableCatalogueItems = items.filter(item => activeItemIds.includes(item.int_Item_Id));

  const [month, setMonth] = useState(requirementPeriod?.txt_Month || 'August');
  const [year, setYear] = useState(requirementPeriod?.int_Year || 2026);
  const [remarks, setRemarks] = useState('');

  // Catalogue Modal Browser State
  const [isCatalogueModalOpen, setIsCatalogueModalOpen] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [selectedModalItems, setSelectedModalItems] = useState([]);
  const [modalItemQuantities, setModalItemQuantities] = useState({}); // { [itemId]: qty }
  const [modalPage, setModalPage] = useState(1);

  useEffect(() => {
    setModalPage(1);
  }, [catalogueSearch, selectedCatFilter]);

  useEffect(() => {
    if (requirementPeriod) {
      if (requirementPeriod.txt_Month) setMonth(requirementPeriod.txt_Month);
      if (requirementPeriod.int_Year) setYear(requirementPeriod.int_Year);
    }
  }, [requirementPeriod]);

  // Rows state for multi-item table input
  const [reqRows, setReqRows] = useState([]);

  const isItemInRequest = (itemId) => {
    return reqRows.some(row => Number(row.int_Product_Id) === Number(itemId));
  };

  const handleModalQtyChange = (itemId, val) => {
    const num = Math.max(1, Number(val) || 1);
    setModalItemQuantities(prev => ({
      ...prev,
      [itemId]: num
    }));
  };

  const handleAddSingleItem = (item, qtyOverride = null) => {
    if (isItemInRequest(item.int_Item_Id)) {
      showToast(`"${item.txt_Item_Name}" is already in your requirement list`, "info");
      return;
    }
    const qty = qtyOverride !== null ? qtyOverride : (modalItemQuantities[item.int_Item_Id] || 10);
    setReqRows(prev => [
      ...prev,
      {
        int_Product_Id: Number(item.int_Item_Id),
        dec_Required_Qty: qty,
        txt_Unit: item.txt_Unit || 'Pcs',
        txt_Remarks: ''
      }
    ]);
    showToast(`Added "${item.txt_Item_Name}" (${qty} ${item.txt_Unit}) to requirement list!`, "success");
  };

  const handleAddMultipleSelected = () => {
    if (selectedModalItems.length === 0) {
      showToast("Please select at least one item from the catalogue", "info");
      return;
    }

    let addedCount = 0;
    const newRows = [...reqRows];

    selectedModalItems.forEach(itemId => {
      if (!newRows.some(r => Number(r.int_Product_Id) === Number(itemId))) {
        const catItem = items.find(i => Number(i.int_Item_Id) === Number(itemId));
        if (catItem) {
          const qty = modalItemQuantities[itemId] || 10;
          newRows.push({
            int_Product_Id: Number(catItem.int_Item_Id),
            dec_Required_Qty: qty,
            txt_Unit: catItem.txt_Unit || 'Pcs',
            txt_Remarks: ''
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      setReqRows(newRows);
      showToast(`Added ${addedCount} item(s) from catalogue!`, "success");
      setSelectedModalItems([]);
      setIsCatalogueModalOpen(false);
    } else {
      showToast("Selected items were already in your requirement list", "info");
    }
  };

  const handleRemoveRow = (index) => {
    setReqRows(reqRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...reqRows];
    const parsedValue = field === 'int_Product_Id' ? Number(value) : field === 'dec_Required_Qty' ? Math.max(1, Number(value) || 1) : value;
    updated[index][field] = parsedValue;

    if (field === 'int_Product_Id') {
      const selectedItem = items.find(i => Number(i.int_Item_Id) === Number(parsedValue));
      if (selectedItem) {
        updated[index].txt_Unit = selectedItem.txt_Unit;
      }
    }

    setReqRows(updated);
  };

  const calculatedBudget = reqRows.reduce((acc, row) => {
    const item = items.find(i => i.int_Item_Id === Number(row.int_Product_Id));
    const price = item ? Number(item.dec_Last_Purchase_Price || 0) : 0;
    return acc + (price * Number(row.dec_Required_Qty || 0));
  }, 0);

  const resetForm = () => {
    setRemarks('');
    setReqRows([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!windowActive) {
      showToast("Requirement window is currently closed by admin", "error");
      return;
    }

    if (reqRows.length === 0) {
      showToast("Please add at least one item to submit your requirement request", "error");
      return;
    }

    try {
      const reqData = {
        int_Store_Id: currentStore?.id || currentStore?.int_Store_Id || 1,
        txt_Month: month,
        int_Year: year,
        dec_Budget: calculatedBudget,
        txt_Remarks: remarks,
        txt_Status: 'Pending Approval',
        txt_Created_By: user?.name || user?.username || currentStore?.name || 'Store Incharge',
        txt_Updated_By: user?.name || user?.username || currentStore?.name || 'Store Incharge'
      };

      const newReq = await apiService.saveRequest(reqData, reqRows);
      const reqNo = newReq?.txt_Request_No || newReq?.txt_Request_Code || 'REQ';
      showToast(`Requirement #${reqNo} submitted to Admin!`, "success");
      resetForm();
      await refreshAll();
      setCurrentTab('history');
    } catch (err) {
      console.error("Submit requirement error:", err);
      showToast(`Error submitting requirement: ${err.message || 'Unknown error'}`, "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Raise Monthly Inventory Requirement</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Check your store's current stock levels and enter the required quantity for each product before submitting to Admin
          </p>
        </div>
      </div>

      {/* WINDOW CLOSED SCREEN */}
      {!windowActive ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={32} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-danger-text)', marginBottom: '8px' }}>
            Requirement Raising Window is Currently Closed
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            {requirementPeriod?.txt_Instructions || 'Stores can raise demands only when Admin opens the requirement period with an active deadline.'}
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '20px',
            background: 'var(--color-surface)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            marginBottom: '24px'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Target Period</span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{requirementPeriod?.txt_Month || 'August'} {requirementPeriod?.int_Year || 2026}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Deadline Was</span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-danger-text)' }}>
                {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Expired'}
              </div>
            </div>
          </div>

          <div>
            <button className="btn btn-secondary" onClick={() => setCurrentTab('history')}>
              View Requirement History
            </button>
          </div>
        </div>
      ) : availableCatalogueItems.length === 0 ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>No Authorized Catalogue Items</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 20px' }}>
            The requirement window is open, but Admin has not assigned any catalogue items for this period yet.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Period Banner */}
          <div className="card" style={{ background: 'var(--color-success-bg)', borderLeft: '5px solid var(--color-success)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-approved" style={{ padding: '4px 10px' }}>
                    <Unlock size={12} /> REQUIREMENT WINDOW OPEN
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Target: {month} {year}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  {requirementPeriod?.txt_Title || 'Monthly Inventory Requirement Window'}
                </h3>
                {requirementPeriod?.txt_Instructions && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    <strong>Admin Note:</strong> {requirementPeriod.txt_Instructions}
                  </p>
                )}
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Submission Deadline
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {requirementPeriod?.dte_Deadline ? new Date(requirementPeriod.dte_Deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Open'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Meta Section */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>1. Requirement Header Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Requirement Code</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={autoReqCode}
                  style={{ backgroundColor: 'var(--color-surface-hover)', fontWeight: 700, color: 'var(--color-primary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hostel Store Unit</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={currentStore?.name || 'Hostel Store'}
                  style={{ backgroundColor: 'var(--color-surface-hover)', fontWeight: 600 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Procurement Month</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={month}
                  style={{ backgroundColor: 'var(--color-surface-hover)', fontWeight: 600 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="form-control"
                  disabled
                  value={year}
                  style={{ backgroundColor: 'var(--color-surface-hover)', fontWeight: 600 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-primary)' }}>Calculated Est. Budget</label>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calculator size={18} />
                  ₹{calculatedBudget.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Requirement Remarks / Justification</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Monthly stock replenishment for upcoming semester intake"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-item Dynamic Input Table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  2. Store Requirement Manifest ({reqRows.length} Items Selected)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  View current stock levels & enter the required quantity for each product before submitting
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setIsCatalogueModalOpen(true)}
                style={{ padding: '10px 18px', fontWeight: 600 }}
              >
                Browse & Add Items from Catalogue
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ minWidth: '220px' }}>Catalogue Product Description</th>
                    <th style={{ textAlign: 'center', background: 'var(--color-surface-hover)' }}>Current Stock (Display Only)</th>
                    <th style={{ minWidth: '160px', background: 'var(--color-primary-light)' }}>Quantity to Request (Add/Edit)</th>
                    <th>Unit</th>
                    <th>Est. Price</th>
                    <th>Line Total</th>
                    <th>Remarks / Notes</th>
                    <th style={{ width: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reqRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-muted)' }}>
                        <ShoppingBag size={36} color="var(--color-primary)" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.6 }} />
                        <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px', fontSize: '0.95rem' }}>No items added to requirement request yet</p>
                        <p style={{ fontSize: '0.85rem', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>Click "Browse & Add from Catalogue" above to select products and enter quantities.</p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setIsCatalogueModalOpen(true)}
                        >
                          Browse & Add from Catalogue
                        </button>
                      </td>
                    </tr>
                  ) : (
                    reqRows.map((row, idx) => {
                      const selectedItem = items.find(i => Number(i.int_Item_Id) === Number(row.int_Product_Id));
                      const unitPrice = selectedItem ? Number(selectedItem.dec_Last_Purchase_Price || 0) : 0;
                      const lineTotal = unitPrice * Number(row.dec_Required_Qty || 0);
                      const currentStock = selectedItem ? (selectedItem.int_quantity_in_hand || 0) : 0;
                      const isLowStock = currentStock < 15;

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                                {selectedItem ? selectedItem.txt_Item_Name : (row.txt_Item_Name || `Product #${row.int_Product_Id}`)}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedItem?.txt_Item_Code || row.product_code || ''}</span>
                                {selectedItem?.txt_Category && (
                                  <span className="category-badge" style={{ fontSize: '0.7rem', padding: '1px 8px' }}>
                                    {selectedItem.txt_Category}
                                  </span>
                                )}
                                <span>Brand: {selectedItem?.txt_Brand || 'Generic'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Current Stock Display Only Column */}
                          <td style={{ textAlign: 'center', background: 'var(--color-surface-hover)' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              backgroundColor: isLowStock ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                              color: isLowStock ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                              border: '1px solid var(--color-border)'
                            }}>
                              {currentStock} {row.txt_Unit}
                            </span>
                          </td>

                          {/* Editable Quantity to Request Column */}
                          <td style={{ background: 'var(--color-primary-light)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <input
                                type="number"
                                min="1"
                                className="form-control"
                                style={{ 
                                  width: '110px', 
                                  fontWeight: 800, 
                                  fontSize: '0.95rem',
                                  color: 'var(--color-primary)', 
                                  border: '2px solid var(--color-primary)' 
                                }}
                                required
                                value={row.dec_Required_Qty}
                                onChange={e => handleRowChange(idx, 'dec_Required_Qty', e.target.value)}
                              />
                            </div>
                          </td>

                          <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            {row.txt_Unit}
                          </td>

                          <td style={{ fontSize: '0.85rem' }}>
                            ₹{unitPrice.toFixed(2)}
                          </td>

                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Urgent allocation for dorms"
                              value={row.txt_Remarks}
                              onChange={e => handleRowChange(idx, 'txt_Remarks', e.target.value)}
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveRow(idx)}
                              title="Remove item from requirement request"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setCurrentTab('history'); }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={reqRows.length === 0}
              style={{
                opacity: reqRows.length === 0 ? 0.5 : 1,
                cursor: reqRows.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={18} /> {reqRows.length > 0 ? `Submit Requirement to Admin (${reqRows.length} Items)` : 'Submit Requirement (Add items to enable)'}
            </button>
          </div>
        </form>
      )}

      {/* CATALOGUE ITEM BROWSER MODAL */}
      {isCatalogueModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCatalogueModalOpen(false)}
          title={`Browse Approved Catalogue (${availableCatalogueItems.length} Items)`}
          maxWidth="920px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search & Category Filter Toolbar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search catalogue by name, code, brand..."
                  value={catalogueSearch}
                  onChange={e => setCatalogueSearch(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
                <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedCatFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCatFilter('ALL')}
                >
                  All
                </button>
                {categories.map(c => (
                  <button
                    key={c.int_Category_Id || c.txt_Category_Name}
                    type="button"
                    className={`btn btn-sm ${selectedCatFilter === c.txt_Category_Name ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCatFilter(c.txt_Category_Name)}
                  >
                    {c.txt_Category_Name}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalogue Table Grid */}
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Select</th>
                    <th>Code</th>
                    <th>Product Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Current Stock (Display Only)</th>
                    <th style={{ width: '130px' }}>Quantity to Request</th>
                    <th>Est. Price</th>
                    <th style={{ width: '110px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = availableCatalogueItems.filter(item => {
                      const matchesSearch = matchesWordPrefix(item.txt_Item_Name, catalogueSearch) ||
                                            matchesWordPrefix(item.txt_Item_Code, catalogueSearch) ||
                                            matchesWordPrefix(item.txt_Brand, catalogueSearch) ||
                                            matchesWordPrefix(item.txt_Category, catalogueSearch);
                      const matchesCategory = selectedCatFilter === 'ALL' || item.txt_Category === selectedCatFilter;
                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>No matches found</div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.slice((modalPage - 1) * 5, modalPage * 5).map(item => {
                      const alreadyAdded = isItemInRequest(item.int_Item_Id);
                      const isChecked = selectedModalItems.includes(item.int_Item_Id);
                      const currentModalQty = modalItemQuantities[item.int_Item_Id] || 10;

                      return (
                        <tr key={item.int_Item_Id} style={{ backgroundColor: alreadyAdded ? 'var(--color-success-bg)' : 'transparent' }}>
                          <td>
                            <input
                              type="checkbox"
                              disabled={alreadyAdded}
                              checked={alreadyAdded || isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedModalItems(selectedModalItems.filter(id => id !== item.int_Item_Id));
                                } else {
                                  setSelectedModalItems([...selectedModalItems, item.int_Item_Id]);
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: alreadyAdded ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.txt_Item_Code}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.txt_Item_Name}</div>
                            {item.txt_Brand && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Brand: {item.txt_Brand}</div>}
                          </td>
                          <td>
                            <span className="category-badge">
                              {item.txt_Category}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--color-surface-hover)',
                              border: '1px solid var(--color-border)'
                            }}>
                              {item.int_quantity_in_hand} {item.txt_Unit}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              disabled={alreadyAdded}
                              className="form-control"
                              style={{ width: '85px', padding: '4px 8px', fontWeight: 700 }}
                              value={currentModalQty}
                              onChange={e => handleModalQtyChange(item.int_Item_Id, e.target.value)}
                            />
                          </td>
                          <td>₹{Number(item.dec_Last_Purchase_Price || 0).toFixed(2)}</td>
                          <td>
                            {alreadyAdded ? (
                              <span className="badge badge-approved" style={{ padding: '4px 8px' }}>
                                ✓ Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddSingleItem(item, currentModalQty)}
                              >
                                <Plus size={14} /> Add
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Catalogue Modal Pagination Bar */}
            {(() => {
              const filteredCount = availableCatalogueItems.filter(item => {
                const matchesSearch = matchesWordPrefix(item.txt_Item_Name, catalogueSearch) ||
                                      matchesWordPrefix(item.txt_Item_Code, catalogueSearch) ||
                                      matchesWordPrefix(item.txt_Brand, catalogueSearch) ||
                                      matchesWordPrefix(item.txt_Category, catalogueSearch);
                const matchesCategory = selectedCatFilter === 'ALL' || item.txt_Category === selectedCatFilter;
                return matchesSearch && matchesCategory;
              }).length;
              const totalPages = Math.ceil(filteredCount / 5) || 1;
              if (totalPages <= 1) return null;

              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Page <strong>{modalPage}</strong> of <strong>{totalPages}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={modalPage === 1}
                      onClick={() => setModalPage(prev => Math.max(prev - 1, 1))}
                      style={{ opacity: modalPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`btn btn-sm ${modalPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setModalPage(pageNum)}
                        style={{ minWidth: '32px', padding: '4px 8px' }}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={modalPage === totalPages}
                      onClick={() => setModalPage(prev => Math.min(prev + 1, totalPages))}
                      style={{ opacity: modalPage === totalPages ? 0.5 : 1 }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {selectedModalItems.length} item(s) selected for bulk add
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCatalogueModalOpen(false)}>
                  Done / Close
                </button>
                {selectedModalItems.length > 0 && (
                  <button type="button" className="btn btn-success" onClick={handleAddMultipleSelected}>
                    <CheckSquare size={16} /> Add {selectedModalItems.length} Selected Item(s)
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
