import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Truck, Edit, Trash2, Star } from 'lucide-react';
import { generateSupplierCode } from '../../utils/codeGenerator';

export const AdminSuppliers = () => {
  const { suppliers, refreshAll, mockApi, showToast } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    txt_Supplier_Code: '',
    txt_Store_Name: '',
    txt_Owner_Name: '',
    txt_Email: '',
    txt_Phone: '',
    txt_Address1: '',
    txt_City: '',
    txt_State: '',
    txt_Pincode: '',
    dbl_Rating: 0,
    txt_GST_Number: '',
    txt_Active: 'Y'
  });

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier, dbl_Rating: supplier.dbl_Rating || 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await mockApi.saveSupplier(editingSupplier ? { ...formData, int_Supplier_Id: editingSupplier.int_Supplier_Id } : formData);
      showToast(editingSupplier ? "Supplier details updated!" : "New supplier registered successfully!", "success");
      setIsModalOpen(false);
      refreshAll();
    } catch (err) {
      showToast("Error saving supplier profile", "error");
    }
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm("Are you sure you want to remove this supplier from the directory?")) {
      try {
        await mockApi.deleteSupplier(supplierId);
        showToast("Supplier profile removed", "info");
        refreshAll();
      } catch (err) {
        showToast("Error removing supplier", "error");
      }
    }
  };

  const columns = [
    { header: 'Code', accessor: 'txt_Supplier_Code', render: row => <strong style={{ color: 'var(--color-purple-text)' }}>{row.txt_Supplier_Code}</strong> },
    { header: 'Supplier / Business Name', accessor: 'txt_Store_Name', render: row => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.txt_Store_Name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Prop: {row.txt_Owner_Name}</div>
      </div>
    )},
    { header: 'GST Number', accessor: 'txt_GST_Number' },
    { header: 'Contact Details', accessor: 'txt_Email', render: row => (
      <div>
        <div>{row.txt_Phone}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{row.txt_Email}</div>
      </div>
    )},
    { header: 'City & State', accessor: 'txt_City', render: row => `${row.txt_City}, ${row.txt_State}` },
    { header: 'Rating', accessor: 'dbl_Rating', render: row => {
      const r = Number(row.dbl_Rating || 0);
      if (r <= 0) {
        return (
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--color-text-muted)', 
            fontStyle: 'italic', 
            background: 'var(--color-surface-hover)', 
            padding: '3px 8px', 
            borderRadius: '4px', 
            border: '1px solid var(--color-border)' 
          }}>
            Unrated
          </span>
        );
      }
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning-text)', fontWeight: 700 }}>
          <Star size={14} fill="var(--color-warning-text)" /> {r.toFixed(1)}
          {row.int_Rating_Count ? <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>({row.int_Rating_Count})</span> : null}
        </div>
      );
    }},
    { header: 'Status', accessor: 'txt_Active', render: row => <StatusBadge status={row.txt_Active === 'Y' ? 'Active' : 'Inactive'} /> },
    { header: 'Actions', render: row => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(row)}><Edit size={14} /></button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.int_Supplier_Id)}><Trash2 size={14} /></button>
      </div>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Supplier Directory</h1>
        </div>
      </div>

      <Table columns={columns} data={suppliers} searchPlaceholder="Search by business name, owner, GST number..." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Supplier: ${editingSupplier?.txt_Store_Name || ''}`}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier Code</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_Supplier_Code}
                onChange={e => setFormData({ ...formData, txt_Supplier_Code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Business / Firm Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Apex Commercial Traders"
                required
                value={formData.txt_Store_Name}
                onChange={e => setFormData({ ...formData, txt_Store_Name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Owner / Contact Person</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_Owner_Name}
                onChange={e => setFormData({ ...formData, txt_Owner_Name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="22AAAAA0000A1Z5"
                required
                value={formData.txt_GST_Number}
                onChange={e => setFormData({ ...formData, txt_GST_Number: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                required
                value={formData.txt_Email}
                onChange={e => setFormData({ ...formData, txt_Email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_Phone}
                onChange={e => setFormData({ ...formData, txt_Phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="form-control"
              placeholder="Commercial Market Road"
              required
              value={formData.txt_Address1}
              onChange={e => setFormData({ ...formData, txt_Address1: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_City}
                onChange={e => setFormData({ ...formData, txt_City: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_State}
                onChange={e => setFormData({ ...formData, txt_State: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rating (0 = Unrated)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="form-control"
                placeholder="0 (Unrated)"
                value={formData.dbl_Rating || 0}
                onChange={e => setFormData({ ...formData, dbl_Rating: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Supplier Profile</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
