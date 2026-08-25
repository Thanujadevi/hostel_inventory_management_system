import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileText, ShoppingBag, Truck, Send, ArrowRight } from 'lucide-react';

export const SupplierDashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { requests, quotations, purchases } = useData();

  const mySubmittedReqIds = new Set(
    (quotations || [])
      .filter(q => q.int_Supplier_Id === user?.id || (user?.company && q.supplier_name === user.company))
      .map(q => Number(q.int_Request_Id))
  );

  const openReqs = requests.filter(r => {
    const isOpen = r.txt_Status === 'Open for Quotation' || r.txt_Status === 'Pending' || r.txt_Status === 'Open';
    return isOpen && !mySubmittedReqIds.has(Number(r.int_Request_Id));
  });

  const supplierPOs = purchases.filter(p => p.supplier_name === (user?.company || 'Apex Commercial Traders'));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Supplier Partner Dashboard</h1>
        </div>
      </div>

      <div className="kpi-grid">
        <Card
          title="Open Bidding Requirements"
          value={openReqs.length}
          icon={FileText}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          subtitle="Hostel requests accepting quotes"
        />
        <Card
          title="Awarded Purchase Orders"
          value={supplierPOs.length}
          icon={ShoppingBag}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success-text)"
          subtitle="Orders received for fulfillment"
        />
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Hostel Requirements Open for Quotation</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('open-reqs')}>
            View Bids <ArrowRight size={14} />
          </button>
        </div>

        {openReqs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No open requirements for bidding at this moment.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Req No</th>
                  <th>College Scope</th>
                  <th>Month</th>
                  <th>Total Requested Products</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openReqs.map(req => (
                  <tr key={req.int_Request_Id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.txt_Request_No}</td>
                    <td>College Hostels</td>
                    <td>{req.txt_Month} {req.int_Year}</td>
                    <td style={{ fontWeight: 600 }}>{(req.items || []).length} Item(s)</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setCurrentTab('open-reqs')}>
                        <Send size={14} /> Submit Product Bid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
