import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

export const StoreInventory = ({ setCurrentTab }) => {
  const { currentStore } = useAuth();
  const { getStoreItems, categories } = useData();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const storeItems = getStoreItems(currentStore?.id);

  const filteredItems = selectedCategory === 'All'
    ? storeItems
    : storeItems.filter(i => i.txt_Category === selectedCategory);

  const columns = [
    { header: 'Item Code', accessor: 'txt_Item_Code', render: row => <strong style={{ color: 'var(--color-primary)' }}>{row.txt_Item_Code}</strong> },
    { header: 'Product Description', accessor: 'txt_Item_Name', render: row => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.txt_Item_Name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Brand: {row.txt_Brand || 'Generic'}</div>
      </div>
    )},
    { header: 'Category', accessor: 'txt_Category', render: row => (
      <span className="category-badge">
        {row.txt_Category}
      </span>
    )},
    { header: 'Unit', accessor: 'txt_Unit' },
    { header: 'Quantity in Hand', accessor: 'int_quantity_in_hand', render: row => {
      const qty = row.int_quantity_in_hand || 0;
      const isLow = qty < 15;
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontWeight: 700,
          fontSize: '0.85rem',
          backgroundColor: isLow ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
          color: isLow ? 'var(--color-danger-text)' : 'var(--color-success-text)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {isLow ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          {qty} {row.txt_Unit}
        </span>
      );
    }},
    { header: 'Reorder Status', render: row => {
      const isLow = (row.int_quantity_in_hand || 0) < 15;
      return isLow ? (
        <button className="btn btn-primary btn-sm" onClick={() => setCurrentTab('raise')}>
          + Reorder
        </button>
      ) : (
        <StatusBadge status="Adequate" />
      );
    }}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Store Stock Inventory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Filter Category:</span>
          <select
            className="form-select"
            style={{ width: '220px' }}
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories ({storeItems.length})</option>
            {categories.map(c => (
              <option key={c.int_Category_Id} value={c.txt_Category_Name}>
                {c.txt_Category_Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Table columns={columns} data={filteredItems} searchPlaceholder="Search inventory by product name, code, brand..." />
    </div>
  );
};
