import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { apiService } from '../../services/api';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { generateStoreCode } from '../../utils/codeGenerator';

export const AdminStores = () => {
  const { stores, refreshAll, mockApi, showToast } = useData();
  const { user } = useAuth();
  const activeUser = user?.name || user?.username || 'Chief Warden / Admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const [formData, setFormData] = useState({
    txt_Store_Code: '',
    txt_Store_Name: '',
    txt_Store_Type: 'Residential Hostel',
    txt_Location: '',
    txt_Incharge_Name: '',
    txt_Email: '',
    txt_Phone: '',
    txt_Username: '',
    txt_Password: '',
    txt_Active: 'Y'
  });

  const openAddModal = () => {
    setEditingStore(null);
    const code = generateStoreCode(stores);
    setFormData({
      txt_Store_Code: code,
      txt_Store_Name: '',
      txt_Store_Type: 'Residential Hostel',
      txt_Location: '',
      txt_Incharge_Name: '',
      txt_Email: '',
      txt_Phone: '',
      txt_Username: code.toLowerCase(),
      txt_Password: 'storepassword',
      txt_Active: 'Y'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setFormData({
      txt_Store_Code: store.txt_Store_Code || '',
      txt_Store_Name: store.txt_Store_Name || '',
      txt_Store_Type: store.txt_Store_Type || 'Residential Hostel',
      txt_Location: store.txt_Location || '',
      txt_Incharge_Name: store.txt_Incharge_Name || '',
      txt_Email: store.txt_Email || '',
      txt_Phone: store.txt_Phone || '',
      txt_Username: store.txt_Username || (store.txt_Store_Code || '').toLowerCase(),
      txt_Password: store.txt_Password || 'storepassword',
      txt_Active: store.txt_Active || 'Y'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        txt_Campus: formData.txt_Location,
        txt_Incharge: formData.txt_Incharge_Name,
        txt_Active: formData.txt_Active || 'Y',
        txt_Password: formData.txt_Password || 'storepassword',
        txt_Created_By: activeUser,
        txt_Updated_By: activeUser
      };
      await apiService.saveStore(editingStore ? { ...payload, int_Store_Id: editingStore.int_Store_Id } : payload);
      showToast(editingStore ? "Store updated successfully!" : "New store registered successfully! Active & login enabled.", "success");
      setIsModalOpen(false);
      await refreshAll();
    } catch (err) {
      console.error("Error saving store:", err);
      showToast("Failed to save store record", "error");
    }
  };

  const handleDelete = async (storeId) => {
    if (window.confirm("Are you sure you want to delete this hostel store?")) {
      try {
        await apiService.deleteStore(storeId);
        showToast("Store record deleted", "info");
        await refreshAll();
      } catch (err) {
        showToast("Error deleting store", "error");
      }
    }
  };

  const columns = [
    { header: 'Store Code', accessor: 'txt_Store_Code', render: row => <strong style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>{row.txt_Store_Code}</strong> },
    {
      header: 'Store Name', accessor: 'txt_Store_Name', render: row => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.txt_Store_Name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{row.txt_Store_Type || 'Residential Hostel'}</div>
        </div>
      )
    },
    {
      header: 'Location', accessor: 'txt_Location', render: row => (
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
          {row.txt_Location || row.txt_Campus || 'Main Campus'}
        </span>
      )
    },
    {
      header: 'In-Charge', accessor: 'txt_Incharge_Name', render: row => {
        const inchargeName = row.txt_Incharge_Name || row.txt_Incharge || 'Store In-Charge';
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{inchargeName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{row.txt_Email}</div>
          </div>
        );
      }
    },
    {
      header: 'Login Credentials', accessor: 'txt_Username', render: row => (
        <div>
          <div className="code-badge" style={{ display: 'inline-block', marginBottom: '2px' }}>User: {row.txt_Username || row.txt_Store_Code?.toLowerCase()}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Pass: {row.txt_Password || 'storepassword'}</div>
        </div>
      )
    },
    { header: 'Status', accessor: 'txt_Active', render: row => <StatusBadge status={row.txt_Active === 'Y' ? 'Active' : 'Inactive'} /> },
    {
      header: 'Actions', render: row => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(row)} title="Edit Store"><Edit size={14} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.int_Store_Id)} title="Delete Store"><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hostel Store Management</h1>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add New Store
        </button>
      </div>

      <Table columns={columns} data={stores} searchPlaceholder="Search by store name, code, or incharge..." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStore ? `Edit Store: ${editingStore.txt_Store_Name}` : "Add New Hostel Store"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Store Code</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.txt_Store_Code}
                onChange={e => setFormData({ ...formData, txt_Store_Code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Store Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Boys Hostel Block A Store"
                required
                value={formData.txt_Store_Name}
                onChange={e => setFormData({ ...formData, txt_Store_Name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Store Type</label>
              <select
                className="form-select"
                value={formData.txt_Store_Type}
                onChange={e => setFormData({ ...formData, txt_Store_Type: e.target.value })}
              >
                <option value="Residential Hostel">Residential Hostel</option>
                <option value="Dining & Kitchen">Dining & Kitchen</option>
                <option value="Sports & Recreation">Sports & Recreation</option>
                <option value="General Campus Store">General Campus Store</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Campus Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. North Campus - Block A"
                required
                value={formData.txt_Location}
                onChange={e => setFormData({ ...formData, txt_Location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">In-Charge Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Staff Member Name"
                required
                value={formData.txt_Incharge_Name}
                onChange={e => setFormData({ ...formData, txt_Incharge_Name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="store@hostel.edu"
                required
                value={formData.txt_Email}
                onChange={e => setFormData({ ...formData, txt_Email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Portal Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. store4 or str004"
              required
              value={formData.txt_Username}
              onChange={e => setFormData({ ...formData, txt_Username: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Portal Password</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. storepassword"
                required
                value={formData.txt_Password}
                onChange={e => setFormData({ ...formData, txt_Password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={formData.txt_Active}
                onChange={e => setFormData({ ...formData, txt_Active: e.target.value })}
              >
                <option value="Y">Active (Login Enabled)</option>
                <option value="N">Inactive (Login Disabled)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Store Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
