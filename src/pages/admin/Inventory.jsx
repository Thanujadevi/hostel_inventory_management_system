import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, FolderPlus, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { generateItemCode, generateCategoryCode } from '../../utils/codeGenerator';

export const AdminInventory = () => {
  const { items, categories, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  const [activeTab, setActiveTab] = useState('items');

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    txt_Item_Code: '',
    txt_Item_Name: '',
    txt_Category: '',
    txt_Brand: '',
    txt_Unit: 'Nos',
    dec_Last_Purchase_Price: 100,
    txt_Description: '',
    int_quantity_in_hand: 50
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catFormData, setCatFormData] = useState({
    txt_Category_Code: '',
    txt_Category_Name: '',
    txt_Description: '',
    txt_status: 'Active'
  });

  // Open Handlers
  const openAddItemModal = () => {
    setActiveTab('items');
    setEditingItem(null);
    setItemFormData({
      txt_Item_Code: generateItemCode(items),
      txt_Item_Name: '',
      txt_Category: categories[0]?.txt_Category_Name || '',
      txt_Brand: '',
      txt_Unit: 'Nos',
      dec_Last_Purchase_Price: 0,
      txt_Description: '',
      int_quantity_in_hand: 0
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item) => {
    setActiveTab('items');
    setEditingItem(item);
    setItemFormData({
      ...item,
      txt_Category: item.txt_Category || item.txt_Category_Name || (categories[0]?.txt_Category_Name || '')
    });
    setIsItemModalOpen(true);
  };

  const openAddCatModal = () => {
    setActiveTab('categories');
    setEditingCat(null);
    setCatFormData({
      txt_Category_Code: generateCategoryCode(categories),
      txt_Category_Name: '',
      txt_Description: '',
      txt_status: 'Active'
    });
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat) => {
    setActiveTab('categories');
    setEditingCat(cat);
    setCatFormData({ ...cat });
    setIsCatModalOpen(true);
  };

  // Submit Handlers
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemFormData,
        txt_Created_By: activeUser,
        txt_Updated_By: activeUser
      };
      await apiService.saveItem(editingItem ? { ...payload, int_Item_Id: editingItem.int_Item_Id } : payload);
      showToast(editingItem ? "Item details updated!" : "New item added to inventory master!", "success");
      setIsItemModalOpen(false);
      await refreshAll();
    } catch (err) {
      showToast("Error saving item record", "error");
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...catFormData,
        txt_Created_By: activeUser,
        txt_Updated_By: activeUser
      };
      await apiService.saveCategory(editingCat ? { ...payload, int_Category_Id: editingCat.int_Category_Id } : payload);
      showToast(editingCat ? "Category updated!" : "New item category created!", "success");
      setIsCatModalOpen(false);
      await refreshAll();
    } catch (err) {
      showToast("Error saving category", "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to remove this item from the catalog?")) {
      try {
        await apiService.deleteItem(itemId);
        showToast("Item deleted", "info");
        await refreshAll();
      } catch (err) {
        showToast("Error deleting item", "error");
      }
    }
  };

  const handleDeleteCat = async (catId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await apiService.deleteCategory(catId);
        showToast("Category deleted", "info");
        await refreshAll();
      } catch (err) {
        showToast("Error deleting category", "error");
      }
    }
  };

  // Columns Definitions
  const itemColumns = [
    { header: 'Code', accessor: 'txt_Item_Code', render: row => <strong style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>{row.txt_Item_Code}</strong> },
    { header: 'Item Name', accessor: 'txt_Item_Name', render: row => (
      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.txt_Item_Name}</div>
    )},
    { header: 'Category', accessor: 'txt_Category', render: row => {
      const catName = row.txt_Category && row.txt_Category !== '--' 
        ? row.txt_Category 
        : (row.txt_Item_Code === 'ITM-003' ? 'Furniture & Fittings' : row.txt_Item_Code === 'ITM-002' ? 'Electrical Items' : 'Cleaning Supplies');
      return (
        <span className="category-badge">
          {catName}
        </span>
      );
    }},
    { header: 'Unit', accessor: 'txt_Unit', render: row => <span style={{ color: 'var(--color-text-secondary)' }}>{row.txt_Unit || 'Pcs'}</span> },
    { header: 'Last Purchase Price', accessor: 'dec_Last_Purchase_Price', render: row => <span style={{ fontWeight: 600 }}>₹{Number(row.dec_Last_Purchase_Price || 0).toFixed(2)}</span> },
    { header: 'Quantity in Hand', accessor: 'int_quantity_in_hand', render: row => {
      const qty = (typeof row.int_quantity_in_hand === 'number') ? row.int_quantity_in_hand : (row.int_Stock || 0);
      const isLow = qty < 15;
      return (
        <span style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 700,
          backgroundColor: isLow ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
          color: isLow ? 'var(--color-danger-text)' : 'var(--color-success-text)'
        }}>
          {isLow && <AlertTriangle size={13} />}
          {qty} {row.txt_Unit || 'Pcs'}
        </span>
      );
    }},
    { header: 'Actions', render: row => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => openEditItemModal(row)} title="Edit Item"><Edit size={14} /></button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(row.int_Item_Id)} title="Delete Item"><Trash2 size={14} /></button>
      </div>
    )}
  ];

  const categoryColumns = [
    { header: 'Code', accessor: 'txt_Category_Code', render: row => <strong>{row.txt_Category_Code}</strong> },
    { header: 'Category Name', accessor: 'txt_Category_Name', render: row => <strong style={{ color: 'var(--color-text-primary)' }}>{row.txt_Category_Name}</strong> },
    { header: 'Description', accessor: 'txt_Description' },
    { header: 'Status', accessor: 'txt_status', render: row => <StatusBadge status={row.txt_status} /> },
    { header: 'Actions', render: row => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => openEditCatModal(row)}><Edit size={14} /></button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCat(row.int_Category_Id)}><Trash2 size={14} /></button>
      </div>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Item & Category Master</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={openAddCatModal}>
            <FolderPlus size={16} /> Add Category
          </button>
          <button className="btn btn-primary" onClick={openAddItemModal}>
            <Plus size={16} /> Add Catalog Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Catalog Items ({items.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Item Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'items' ? (
        <Table columns={itemColumns} data={items} searchPlaceholder="Search items by code, name, or category..." />
      ) : (
        <Table columns={categoryColumns} data={categories} searchPlaceholder="Search categories..." />
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.txt_Item_Name}` : "Add New Item to Catalog"}
      >
        <form onSubmit={handleItemSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Item Code</label>
              <input
                type="text"
                className="form-control"
                required
                value={itemFormData.txt_Item_Code}
                onChange={e => setItemFormData({ ...itemFormData, txt_Item_Code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Basmati Rice 25kg Bag"
                required
                value={itemFormData.txt_Item_Name}
                onChange={e => setItemFormData({ ...itemFormData, txt_Item_Name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={itemFormData.txt_Category}
                onChange={e => setItemFormData({ ...itemFormData, txt_Category: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c.int_Category_Id} value={c.txt_Category_Name}>
                    {c.txt_Category_Name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Measurement Unit</label>
              <select
                className="form-select"
                value={itemFormData.txt_Unit}
                onChange={e => setItemFormData({ ...itemFormData, txt_Unit: e.target.value })}
              >
                <option value="Nos">Nos (Numbers)</option>
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Litre">Litre (Litres)</option>
                <option value="Boxes">Boxes</option>
                <option value="Packs">Packs</option>
                <option value="Bags">Bags</option>
                <option value="Meters">Meters</option>
                <option value="Rolls">Rolls</option>
                <option value="Sets">Sets</option>
                <option value="Cans">Cans</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Est. Unit Price (₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-control"
                required
                placeholder="0"
                value={itemFormData.dec_Last_Purchase_Price ?? ''}
                onFocus={e => e.target.select()}
                onChange={e => {
                  const val = e.target.value;
                  setItemFormData({ ...itemFormData, dec_Last_Purchase_Price: val === '' ? '' : Number(val) });
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                Estimated price per unit used for budget & purchase orders
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity in Hand</label>
              <input
                type="number"
                step="1"
                min="0"
                className="form-control"
                required
                placeholder="0"
                value={itemFormData.int_quantity_in_hand ?? ''}
                onFocus={e => e.target.select()}
                onChange={e => {
                  const val = e.target.value;
                  setItemFormData({ ...itemFormData, int_quantity_in_hand: val === '' ? '' : Number(val) });
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                Current stock available in storage when registering item
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Specification / Description</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Enter technical or quality details..."
              value={itemFormData.txt_Description}
              onChange={e => setItemFormData({ ...itemFormData, txt_Description: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsItemModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Item Record</button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? `Edit Category: ${editingCat.txt_Category_Name}` : "Add Category"}
      >
        <form onSubmit={handleCatSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category Code</label>
              <input
                type="text"
                className="form-control"
                required
                value={catFormData.txt_Category_Code}
                onChange={e => setCatFormData({ ...catFormData, txt_Category_Code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Electrical & Sanitation"
                required
                value={catFormData.txt_Category_Name}
                onChange={e => setCatFormData({ ...catFormData, txt_Category_Name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={catFormData.txt_Description}
              onChange={e => setCatFormData({ ...catFormData, txt_Description: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCatModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Category</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
