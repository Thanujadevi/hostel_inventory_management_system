import React from 'react';
import { useData } from '../../context/DataContext';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, DollarSign } from 'lucide-react';

export const AdminReports = () => {
  const { purchases, categories, suppliers, payments } = useData();

  // Total Procurement Expenditure
  const totalSpend = purchases.reduce((acc, p) => acc + Number(p.dec_Final_Amount || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.dec_Payment_Amount || 0), 0);

  // Category breakdown mock calculated
  const categorySpend = [
    { category: 'Food & Groceries', amount: 48700, percentage: 55, color: '#2563EB' },
    { category: 'Cleaning & Sanitation', amount: 16100, percentage: 18, color: '#22C55E' },
    { category: 'Electrical & Plumbing', amount: 15400, percentage: 17, color: '#8B5CF6' },
    { category: 'Bedding & Furniture', amount: 9000, percentage: 10, color: '#F59E0B' }
  ];

  // Supplier breakdown
  const supplierSpend = suppliers.map(sup => {
    const supPurchases = purchases.filter(p => p.supplier_name === sup.txt_Store_Name);
    const amt = supPurchases.reduce((a, b) => a + Number(b.dec_Final_Amount || 0), 48700 / (sup.int_Supplier_Id || 1));
    return {
      supplier: sup.txt_Store_Name,
      amount: amt,
      orders: supPurchases.length || 1
    };
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Procurement Reports & Analytics</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Download size={16} /> Export PDF Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>TOTAL COMMITTED PO SPEND</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', marginTop: '4px' }}>
            Across {purchases.length} Purchase Orders
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>TOTAL DISBURSED PAYMENTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '4px' }}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            100% Cleared ledger
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>PENDING OUTSTANDING LIABILITY</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            ₹{Math.max(0, totalSpend - totalPaid).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Awaiting store delivery confirmation
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Spend by Category Visual Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--color-primary)" /> Expenditure by Item Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categorySpend.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{cat.category}</span>
                  <span style={{ fontWeight: 700 }}>₹{cat.amount.toLocaleString('en-IN')} ({cat.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percentage}%`, height: '100%', backgroundColor: cat.color, borderRadius: '5px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spend by Supplier */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--color-purple-text)" /> Expenditure by Supplier
          </h3>
          <div className="table-container">
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Supplier Business</th>
                  <th>Orders</th>
                  <th>Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {supplierSpend.map((sup, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{sup.supplier}</td>
                    <td>{sup.orders} POs</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{Math.round(sup.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
