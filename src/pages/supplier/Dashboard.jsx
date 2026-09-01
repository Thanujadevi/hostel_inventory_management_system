import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileText, ShoppingBag, Truck, Send, ArrowRight } from 'lucide-react';

export const SupplierDashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { requests, quotations, purchases } = useData();

  const mySubmittedReqIds = React.useMemo(() => {
    const sId = Number(user?.id || user?.int_Supplier_Id || user?.supplierDetails?.int_Supplier_Id || 0);
    const sCompany = (user?.company || user?.name || '').trim().toLowerCase();

    if (!sId && !sCompany) return new Set();

    return new Set(
      (quotations || [])
        .filter(q => {
          if (!q) return false;
          const qSupId = Number(q.int_Supplier_Id || q.int_Supplier_ID || 0);
          if (sId > 0 && qSupId > 0) {
            return qSupId === sId;
          }
          const qSupName = (q.supplier_name || q.txt_Supplier_Name || q.txt_Created_By || '').trim().toLowerCase();
          if (sCompany && qSupName) {
            return qSupName === sCompany || qSupName.includes(sCompany) || sCompany.includes(qSupName);
          }
          return false;
        })
        .map(q => Number(q.int_Request_Id))
    );
  }, [quotations, user]);

  // Consolidate open bidding requirements month-wise for National Engineering College
  const openReqs = React.useMemo(() => {
    const periodMap = new Map();

    (requests || []).forEach(r => {
      if (!r) return;
      const isOpen = r.txt_Status === 'Open for Quotation' || r.txt_Status === 'Approved' || r.txt_Status === 'Pending' || r.txt_Status === 'Open';
      const alreadyBidded = mySubmittedReqIds.has(Number(r.int_Request_Id));

      if (isOpen && !alreadyBidded) {
        const periodKey = `${r.txt_Month || 'August'}_${r.int_Year || 2026}`;
        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, {
            int_Request_Id: r.int_Request_Id,
            txt_Request_No: `REQ-${(r.txt_Month || 'AUG').toUpperCase().slice(0, 3)}-${r.int_Year || 2026}`,
            college_name: 'National Engineering College',
            txt_Month: r.txt_Month || 'August',
            int_Year: r.int_Year || 2026,
            itemsMap: new Map()
          });
        }
        const periodGroup = periodMap.get(periodKey);
        (r.items || []).forEach(item => {
          const pId = item.int_Product_Id || item.int_Item_Id;
          const pName = item.product_name || item.txt_Item_Name || `Product #${pId}`;
          if (!periodGroup.itemsMap.has(pId)) {
            periodGroup.itemsMap.set(pId, pName);
          }
        });
      }
    });

    return Array.from(periodMap.values()).map(g => {
      const pNames = Array.from(g.itemsMap.values());
      const productSummary = `${pNames.length} Item(s)`;

      return {
        ...g,
        productSummary,
        totalItemsCount: pNames.length
      };
    });
  }, [requests, mySubmittedReqIds]);

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
                  <th>College Name</th>
                  <th>Target Month</th>
                  <th>Total Requested Products</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openReqs.map(req => (
                  <tr key={req.int_Request_Id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{req.txt_Request_No}</td>
                    <td style={{ fontWeight: 600 }}>National Engineering College</td>
                    <td>{req.txt_Month} {req.int_Year}</td>
                    <td style={{ fontWeight: 600 }}>{req.productSummary}</td>
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
