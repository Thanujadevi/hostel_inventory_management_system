import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Table } from '../../components/common/Table';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Users as UsersIcon, UserCheck, Shield, Building2, Truck, Search, Mail, Phone, Lock } from 'lucide-react';
import { matchesWordPrefix } from '../../utils/searchUtils';

export const AdminUsers = () => {
  const { stores, suppliers } = useData();

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Static/dynamic Admin accounts
  const adminUsers = [
    {
      id: 'ADM001',
      name: 'Chief Warden / Admin',
      email: '24104063@nec.edu.in',
      phone: '+91 98765 43210',
      role: 'Chief Warden / Admin',
      type: 'admin',
      associated: 'Central Administration',
      status: 'Active'
    },
    {
      id: 'ADM002',
      name: 'Deputy Warden',
      email: 'deputywarden@nec.edu.in',
      phone: '+91 98765 43211',
      role: 'Deputy Warden',
      type: 'admin',
      associated: 'Hostel Administration',
      status: 'Active'
    }
  ];

  // Map Stores to Store Manager Users
  const storeUsers = useMemo(() => {
    return stores.map(store => ({
      id: `STR-${store.int_Store_Id}`,
      name: store.txt_Manager_Name || `Store Manager (${store.txt_Store_Name})`,
      email: store.txt_Manager_Email || `${store.txt_Store_Code?.toLowerCase() || 'store'}@nec.edu.in`,
      phone: store.txt_Phone || '+91 94433 12345',
      role: 'Hostel Store Manager',
      type: 'store',
      associated: store.txt_Store_Name,
      status: 'Active'
    }));
  }, [stores]);

  // Map Suppliers to Supplier Users
  const supplierUsers = useMemo(() => {
    return suppliers.map(sup => ({
      id: `SUP-${sup.int_Supplier_Id}`,
      name: sup.txt_Owner_Name || sup.txt_Supplier_Name,
      email: sup.txt_Email || `${sup.txt_Phone}@supplier.com`,
      phone: sup.txt_Phone ? `+91 ${sup.txt_Phone}` : 'N/A',
      role: 'Registered Supplier',
      type: 'supplier',
      associated: sup.txt_Store_Name || sup.txt_Supplier_Name,
      status: sup.txt_Profile_Completed === 'N' ? 'Pending Approval' : 'Active'
    }));
  }, [suppliers]);

  // Combine all users
  const allUsers = useMemo(() => {
    return [...adminUsers, ...storeUsers, ...supplierUsers];
  }, [storeUsers, supplierUsers]);

  // Filter Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesRole = roleFilter === 'ALL' || u.type === roleFilter;
      const matchesSearch = !searchTerm || matchesWordPrefix(u, searchTerm);
      return matchesRole && matchesSearch;
    });
  }, [allUsers, roleFilter, searchTerm]);

  // Counts
  const adminCount = adminUsers.length;
  const storeCount = storeUsers.length;
  const supplierCount = supplierUsers.length;

  const columns = [
    {
      header: 'User',
      accessor: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: row.type === 'admin' ? '#dbeafe' : row.type === 'store' ? '#e0e7ff' : '#dcfce7',
            color: row.type === 'admin' ? '#1e40af' : row.type === 'store' ? '#3730a3' : '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            flexShrink: 0
          }}>
            {(row.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{row.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={12} /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Role / Designation',
      accessor: 'role',
      render: (row) => (
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '20px',
          backgroundColor: row.type === 'admin' ? '#eff6ff' : row.type === 'store' ? '#f5f3ff' : '#f0fdf4',
          color: row.type === 'admin' ? '#1d4ed8' : row.type === 'store' ? '#6d28d9' : '#15803d',
          border: `1px solid ${row.type === 'admin' ? '#bfdbfe' : row.type === 'store' ? '#ddd6fe' : '#bbf7d0'}`
        }}>
          {row.role}
        </span>
      )
    },
    {
      header: 'Department / Entity',
      accessor: 'associated',
      render: (row) => (
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {row.associated}
        </div>
      )
    },
    {
      header: 'Contact Number',
      accessor: 'phone',
      render: (row) => (
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Phone size={13} color="var(--color-text-muted)" /> {row.phone}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>System User Directory</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Manage authorized system accounts, store managers, and registered suppliers
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <Card
          title="Total System Users"
          value={allUsers.length}
          icon={UsersIcon}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          subtitle="All active portal accounts"
        />
        <Card
          title="Administrators"
          value={adminCount}
          icon={Shield}
          iconBg="#dbeafe"
          iconColor="#1e40af"
          subtitle="Chief Wardens & Admins"
        />
        <Card
          title="Hostel Store Managers"
          value={storeCount}
          icon={Building2}
          iconBg="#f5f3ff"
          iconColor="#6d28d9"
          subtitle="Store In-Charge staff"
        />
        <Card
          title="Registered Suppliers"
          value={supplierCount}
          icon={Truck}
          iconBg="#f0fdf4"
          iconColor="#15803d"
          subtitle="Authorized vendor portals"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div className="tabs-container" style={{ margin: 0, borderBottom: 'none' }}>
            <button
              type="button"
              className={`tab-btn ${roleFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setRoleFilter('ALL')}
            >
              All Users ({allUsers.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              Admins ({adminCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${roleFilter === 'store' ? 'active' : ''}`}
              onClick={() => setRoleFilter('store')}
            >
              Store Managers ({storeCount})
            </button>
            <button
              type="button"
              className={`tab-btn ${roleFilter === 'supplier' ? 'active' : ''}`}
              onClick={() => setRoleFilter('supplier')}
            >
              Suppliers ({supplierCount})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '36px' }}
              placeholder="Search user name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card">
        <Table
          columns={columns}
          data={filteredUsers}
          searchPlaceholder="Filter user records..."
          emptyMessage="No user accounts found"
          pageSize={8}
          showSearch={false}
        />
      </div>
    </div>
  );
};
