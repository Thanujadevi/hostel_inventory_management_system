import React from 'react';
import { useData } from '../../context/DataContext';
import { BarChart3, PieChart, Download, DollarSign, CheckCircle, Clock } from 'lucide-react';

export const AdminReports = () => {
  const { purchases, categories, suppliers, payments } = useData();

  // Total Procurement Expenditure from live Purchases & Payments
  const totalSpend = (Array.isArray(purchases) ? purchases : []).reduce((acc, p) => acc + Number(p.dec_Final_Amount || 0), 0);
  const totalPaid = (Array.isArray(payments) ? payments : []).reduce((acc, p) => acc + Number(p.dec_Payment_Amount || 0), 0);
  const pendingPayments = Math.max(0, totalSpend - totalPaid);

  // Dynamic Category breakdown computed strictly from real purchase orders
  const categorySpendMap = {};
  (Array.isArray(categories) ? categories : []).forEach(c => {
    if (c?.txt_Category_Name) {
      categorySpendMap[c.txt_Category_Name] = 0;
    }
  });

  (Array.isArray(purchases) ? purchases : []).forEach(p => {
    const pAmt = Number(p.dec_Final_Amount || 0);
    const catName = p.txt_Category || 'General';
    categorySpendMap[catName] = (categorySpendMap[catName] || 0) + pAmt;
  });

  const colors = ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
  const categoryList = Object.keys(categorySpendMap);
  const categorySpend = categoryList.map((cat, idx) => {
    const amt = categorySpendMap[cat];
    const percentage = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
    return {
      category: cat,
      amount: amt,
      percentage: percentage,
      color: colors[idx % colors.length]
    };
  });

  // Dynamic Supplier breakdown computed strictly from real purchase orders
  const supplierSpend = (Array.isArray(suppliers) ? suppliers : []).map(sup => {
    const supName = sup.txt_Supplier_Name || sup.txt_Store_Name || `Supplier #${sup.int_Supplier_Id}`;
    const supPurchases = (Array.isArray(purchases) ? purchases : []).filter(p => 
      String(p.int_Supplier_Id) === String(sup.int_Supplier_Id) || 
      p.supplier_name === supName ||
      p.txt_Supplier_Name === supName
    );
    const amt = supPurchases.reduce((acc, p) => acc + Number(p.dec_Final_Amount || 0), 0);
    return {
      supplier: supName,
      amount: amt,
      orders: supPurchases.length
    };
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports & Summary</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Live procurement metrics, category expenditures, and supplier transaction logs derived from database records.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Download size={16} /> Export PDF Report
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>TOTAL ORDER SPEND</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', marginTop: '4px' }}>
            Across {purchases.length} Approved Orders
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>TOTAL PAYMENTS MADE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '4px' }}>
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Recorded in Payment Ledger
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>PENDING PAYMENTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            ₹{pendingPayments.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {pendingPayments > 0 ? 'Outstanding balance to suppliers' : 'All approved orders fully settled'}
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Expenditure by Category Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--color-primary)" /> Expenditure by Item Category
          </h3>
          {categorySpend.length === 0 || totalSpend === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              No category procurement transactions recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categorySpend.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{cat.category}</span>
                    <span style={{ fontWeight: 700 }}>₹{cat.amount.toLocaleString('en-IN')} ({cat.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(cat.percentage, cat.amount > 0 ? 5 : 0)}%`, height: '100%', backgroundColor: cat.color, borderRadius: '5px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenditure by Supplier */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--color-purple-text)" /> Expenditure by Supplier
          </h3>
          <div className="table-container">
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Supplier Business</th>
                  <th style={{ textAlign: 'center' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {supplierSpend.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '20px' }}>
                      No registered suppliers available.
                    </td>
                  </tr>
                ) : (
                  supplierSpend.map((sup, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sup.supplier}</td>
                      <td style={{ textAlign: 'center' }}>{sup.orders} POs</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{Math.round(sup.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
