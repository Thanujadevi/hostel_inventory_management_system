import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Modal } from '../../components/common/Modal';
import { Send, Truck, Package, Layers, CheckCircle, Printer, Download, FileText } from 'lucide-react';
import { generateQuotationCode } from '../../utils/codeGenerator';

export const SupplierRequirements = () => {
  const { user } = useAuth();
  const { requests, quotations, items, mockApi, showToast, refreshAll } = useData();

  // Set of request IDs that current logged-in supplier has already submitted bids for
  const mySubmittedReqIds = useMemo(() => {
    return new Set(
      (quotations || [])
        .filter(q => q.int_Supplier_Id === user?.id || (user?.company && q.supplier_name === user.company))
        .map(q => Number(q.int_Request_Id))
    );
  }, [quotations, user]);

  // Open requirements that HAVE NOT been bid on yet by this supplier
  const openUnbiddedReqs = useMemo(() => {
    const openList = requests.filter(r => {
      const isOpen = ['Open for Quotation', 'Pending', 'Open', 'Accepted', 'Approved', 'Pending Approval'].includes(r.txt_Status);
      const alreadyBidded = mySubmittedReqIds.has(Number(r.int_Request_Id));
      return isOpen && !alreadyBidded;
    });

    if (openList.length === 0 && requests.length > 0) {
      return requests.filter(r => !mySubmittedReqIds.has(Number(r.int_Request_Id)));
    }
    return openList;
  }, [requests, mySubmittedReqIds]);

  // Aggregate products for bidding (Product Name & Category only - No Quantities sent to supplier)
  const consolidatedProducts = useMemo(() => {
    const targetReqs = openUnbiddedReqs;
    const map = {};

    targetReqs.forEach(req => {
      (req.items || []).forEach(item => {
        const pId = Number(item.int_Product_Id ?? item.int_Item_Id);
        if (!pId) return;

        const masterItem = (items || []).find(m => Number(m.int_Item_Id) === pId);
        
        if (!map[pId]) {
          const pName = item.txt_Item_Name || item.product_name || item.txt_Product_Name || masterItem?.txt_Item_Name || `Product #${pId}`;
          const pCode = item.txt_Item_Code || item.product_code || item.txt_Product_Code || masterItem?.txt_Item_Code || `PRD-${String(pId).padStart(3, '0')}`;
          const pCat = item.txt_Category || item.category || item.txt_Category_Name || masterItem?.txt_Category || 'General';
          const pBrand = item.txt_Brand || item.brand || masterItem?.txt_Brand || '';

          map[pId] = {
            int_Product_Id: pId,
            product_code: pCode,
            product_name: pName,
            category: pCat,
            brand: pBrand,
            req_ids: new Set()
          };
        }
        map[pId].req_ids.add(req.int_Request_Id);
      });
    });

    // Fallback: If no requests mapped, show catalog items so supplier can always quote unit prices
    if (Object.keys(map).length === 0 && items && items.length > 0) {
      items.forEach(m => {
        const pId = Number(m.int_Item_Id);
        map[pId] = {
          int_Product_Id: pId,
          product_code: m.txt_Item_Code || `ITM-${String(pId).padStart(3, '0')}`,
          product_name: m.txt_Item_Name || `Item #${pId}`,
          category: m.txt_Category || m.txt_Category_Name || 'General',
          brand: m.txt_Brand || '',
          req_ids: new Set()
        };
      });
    }

    return Object.values(map);
  }, [openUnbiddedReqs, items]);

  const autoQuotationCode = generateQuotationCode(quotations || []);
  const [transportCost, setTransportCost] = useState(500);
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [remarks, setRemarks] = useState('Consolidated institutional rate with bulk delivery');
  const [loading, setLoading] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Per-product unit price map: { [product_id]: price }
  const [unitPrices, setUnitPrices] = useState({});

  const handlePriceChange = (productId, price) => {
    setUnitPrices(prev => ({
      ...prev,
      [productId]: price === '' ? '' : Number(price)
    }));
  };

  const getProductPrice = (productId) => {
    if (unitPrices[productId] !== undefined && unitPrices[productId] !== '') {
      return Number(unitPrices[productId]);
    }
    const masterItem = (items || []).find(m => Number(m.int_Item_Id) === Number(productId));
    if (masterItem && Number(masterItem.dec_Last_Purchase_Price || masterItem.dbl_Unit_Price) > 0) {
      return Number(masterItem.dec_Last_Purchase_Price || masterItem.dbl_Unit_Price);
    }
    return 120; // Default fallback unit rate
  };

  // Calculations for Template Totals
  const subtotal = useMemo(() => {
    return consolidatedProducts.reduce((sum, prod) => {
      const price = getProductPrice(prod.int_Product_Id);
      return sum + price;
    }, 0);
  }, [consolidatedProducts, unitPrices, items]);

  const taxableFreight = Number(transportCost || 0);
  const taxRate = 0.18; // 18% GST
  const taxDue = (subtotal + taxableFreight) * taxRate;
  const grandTotal = subtotal + taxableFreight + taxDue;

  const handleSubmitQuote = async (e) => {
    if (e) e.preventDefault();
    if (consolidatedProducts.length === 0) {
      showToast("No open product requirements to bid on.", "warning");
      return;
    }

    setLoading(true);
    try {
      const targetReqs = openUnbiddedReqs.length > 0 ? openUnbiddedReqs : [{ int_Request_Id: 1 }];
      
      for (const req of targetReqs) {
        if (!req) continue;
        const itemsList = consolidatedProducts.map(prod => {
          const uPrice = getProductPrice(prod.int_Product_Id);
          return {
            int_Product_Id: prod.int_Product_Id,
            dec_Unit_Price: uPrice,
            dec_Available_Qty: 100
          };
        });

        const qData = {
          int_Request_Id: req.int_Request_Id,
          int_Supplier_Id: user?.id || 1,
          supplier_name: user?.company || user?.name || 'Apex Traders',
          dec_Transport_Cost: Number(transportCost || 500),
          int_Delivery_Days: Number(deliveryDays || 3),
          txt_Remarks: remarks
        };

        await mockApi.submitQuotation(qData, itemsList);
      }

      await refreshAll();
      showToast("Consolidated unit price quotation submitted successfully!", "success");
      setIsPrintModalOpen(true);
    } catch (err) {
      console.error("Error submitting quotation:", err);
      showToast("Failed to submit quotation bid", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentDateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  // Quote validity: 30 days from today
  const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Supplier Product Unit Price Quotation</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Review requested product catalog items and submit your unit price bids.
          </p>
        </div>
      </div>

      {consolidatedProducts.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          {mySubmittedReqIds.size > 0 ? (
            <>
              <CheckCircle size={44} color="var(--color-success-text, #059669)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Quotation Submitted!
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
                Your firm has submitted unit price quotations for all requested items.
              </p>
            </>
          ) : (
            <>
              <Package size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h3>No Open Product Requirements Available</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>There are currently no active product requirements open for bidding.</p>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmitQuote} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Product Items Table (Name & Category Only - No Quantities) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Requested Product Items</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Provide your firm's unit price rate (₹) for each requested item
                </span>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <Layers size={14} style={{ marginRight: '6px' }} /> Product & Category Specification
              </span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>PRODUCT CODE & NAME</th>
                    <th>CATEGORY</th>
                    <th style={{ width: '250px' }}>OFFERED UNIT PRICE (₹) *</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedProducts.map((prod, idx) => {
                    const price = getProductPrice(prod.int_Product_Id);

                    return (
                      <tr key={prod.int_Product_Id}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>{prod.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-purple-text)', fontWeight: 600 }}>
                            Code: {prod.product_code} {prod.brand ? `| Brand: ${prod.brand}` : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-bg-secondary, #f1f5f9)',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)'
                          }}>
                            {prod.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>₹</span>
                            <input
                              type="number"
                              step="5"
                              min="0"
                              className="form-control"
                              style={{ fontWeight: 700, fontSize: '0.95rem' }}
                              required
                              value={unitPrices[prod.int_Product_Id] !== undefined ? unitPrices[prod.int_Product_Id] : price}
                              onChange={e => handlePriceChange(prod.int_Product_Id, e.target.value)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Terms Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Logistics & Commercial Bidding Terms</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quotation Reference Code</label>
                <input
                  type="text"
                  className="form-control"
                  disabled
                  value={autoQuotationCode}
                  style={{ backgroundColor: 'var(--color-bg-secondary, #f8fafc)', fontWeight: 700, color: 'var(--color-purple-text)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Freight & Transport Charge (₹)</label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  className="form-control"
                  required
                  value={transportCost}
                  onChange={e => setTransportCost(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Turnaround (Days)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  value={deliveryDays}
                  onChange={e => setDeliveryDays(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Commercial Notes & Quality Assurance Terms</label>
              <textarea
                className="form-control"
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter payment terms, warranty info, or bulk rate terms..."
              />
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPrintModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer size={16} /> Export / Preview PDF
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
            >
              <Send size={16} /> {loading ? 'Submitting Quotation...' : 'Submit Unit Price Quote'}
            </button>
          </div>
        </form>
      )}

      {/* Printable PDF Modal - Single Page Template Match */}
      {isPrintModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          title="Supplier Price Quote PDF Document"
          maxWidth="850px"
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' }} className="no-print">
            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button className="btn btn-secondary" onClick={() => setIsPrintModalOpen(false)}>
              Close
            </button>
          </div>

          <div className="printable-quotation-report" style={{
            background: '#ffffff',
            color: '#1a1a1a',
            padding: '24px 30px',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            boxSizing: 'border-box',
            maxWidth: '800px',
            margin: '0 auto',
            border: '1px solid #d1d5db'
          }}>
            
            {/* 1. TOP HEADER ROW */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              
              {/* Top Left: Supplier Logo & Company Name */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  backgroundColor: '#7c98c4',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  letterSpacing: '1px'
                }}>
                  LOGO
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#36538c', fontFamily: 'Arial, sans-serif' }}>
                    {user?.company || user?.name || 'Apex Traders & Supplies Ltd.'}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.35', marginTop: '3px' }}>
                    12, Industrial Estate Road, Kovilpatti - 628 501<br />
                    Tamil Nadu, India | Website: www.apextraders.com<br />
                    Phone: {user?.phone || '+91 98765 43210'} | Email: {user?.email || 'apex@traders.com'}<br />
                    <strong>Prepared by:</strong> {user?.name || 'Ramesh Patel'} (Commercial Head)
                  </div>
                </div>
              </div>

              {/* Top Right: QUOTE Title & Meta Grid Box */}
              <div style={{ textAlign: 'right', minWidth: '200px' }}>
                <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#5b7db3', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  QUOTE
                </h1>
                         <table style={{
                  marginTop: '8px',
                  marginLeft: 'auto',
                  borderCollapse: 'collapse',
                  border: '1px solid #36538c',
                  fontSize: '0.78rem',
                  fontFamily: 'sans-serif'
                }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', fontWeight: 700, backgroundColor: '#f3f4f6', textAlign: 'right' }}>DATE</td>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', textAlign: 'center', minWidth: '100px' }}>{currentDateStr} {currentTimeStr}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', fontWeight: 700, backgroundColor: '#f3f4f6', textAlign: 'right' }}>QUOTE #</td>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', textAlign: 'center', fontWeight: 700 }}>{autoQuotationCode}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', fontWeight: 700, backgroundColor: '#f3f4f6', textAlign: 'right' }}>CUSTOMER ID</td>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', textAlign: 'center' }}>NEC-HOSTEL-001</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', fontWeight: 700, backgroundColor: '#f3f4f6', textAlign: 'right' }}>VALID UNTIL</td>
                      <td style={{ border: '1px solid #36538c', padding: '3px 8px', textAlign: 'center' }}>{validUntilDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. CUSTOMER BOX ("TO" SECTION) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#36538c',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '4px 10px',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                CUSTOMER
              </div>
              <div style={{ border: '1px solid #36538c', borderTop: 'none', padding: '8px 12px', fontSize: '0.82rem', color: '#1f2937', lineHeight: '1.4' }}>
                <strong style={{ fontSize: '0.9rem', color: '#111827' }}>National Engineering College (Autonomous)</strong><br />
                Chief Warden & Hostel Inventory Requisition Committee<br />
                K.R. Nagar, Kovilpatti - 628 503, Thoothukudi District, Tamil Nadu<br />
                Phone: +91 4632 222502 | Email: hostel@nec.edu.in
              </div>
            </div>

            {/* 3. ITEMS & DESCRIPTION TABLE */}
            <div style={{ marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #36538c' }}>
                <thead>
                  <tr style={{ backgroundColor: '#36538c', color: '#ffffff', textAlign: 'left', fontSize: '0.82rem' }}>
                    <th style={{ padding: '6px 10px', borderRight: '1px solid #ffffff' }}>DESCRIPTION</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', width: '110px', borderRight: '1px solid #ffffff' }}>UNIT PRICE (₹)</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', width: '50px', borderRight: '1px solid #ffffff' }}>QTY</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', width: '60px', borderRight: '1px solid #ffffff' }}>TAXED</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', width: '110px' }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedProducts.map((prod, idx) => {
                    const price = getProductPrice(prod.int_Product_Id);
                    return (
                      <tr key={prod.int_Product_Id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid #d1d5db' }}>
                          <strong style={{ color: '#111827' }}>[{prod.product_name}]</strong>
                          <span style={{ color: '#4b5563', marginLeft: '6px' }}>Code: {prod.product_code} | Cat: {prod.category}</span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', borderRight: '1px solid #d1d5db' }}>{price.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #d1d5db' }}>1</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #d1d5db' }}>X</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{price.toFixed(2)}</td>
                      </tr>
                    );
                  })}

                  {/* Empty template rows for clean spacing */}
                  {Array.from({ length: Math.max(0, 2 - consolidatedProducts.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} style={{ height: '20px', backgroundColor: (consolidatedProducts.length + i) % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ borderRight: '1px solid #d1d5db' }}></td>
                      <td style={{ borderRight: '1px solid #d1d5db' }}></td>
                      <td style={{ borderRight: '1px solid #d1d5db' }}></td>
                      <td style={{ borderRight: '1px solid #d1d5db' }}></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. TERMS & CONDITIONS (LEFT) + TOTALS GRID (RIGHT) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
              
              {/* Left: Terms and Conditions */}
              <div>
                <div style={{
                  backgroundColor: '#36538c',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  TERMS AND CONDITIONS
                </div>
                <div style={{ border: '1px solid #36538c', borderTop: 'none', padding: '8px 10px', fontSize: '0.75rem', color: '#374151', lineHeight: '1.4' }}>
                  1. Customer will be billed after indicating acceptance of this quote.<br />
                  2. Payment will be due prior to delivery of service and goods.<br />
                  3. Guaranteed delivery turnaround: <strong>{deliveryDays} Days</strong>.<br />
                  4. Freight charges included as specified.<br />
                  <div style={{ marginTop: '14px' }}>
                    <strong>Customer Acceptance (sign below):</strong>
                    <div style={{ marginTop: '16px' }}>x ________________________________________</div>
                    <div style={{ marginTop: '4px', color: '#6b7280' }}>Print Name: ______________________________</div>
                  </div>
                </div>
              </div>

              {/* Right: Subtotal, Tax, Total Table */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>Subtotal</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', width: '90px' }}>₹ {subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>Taxable Freight</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹ {taxableFreight.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>Tax rate</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}>18.000%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>Tax due</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹ {taxDue.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #36538c', borderBottom: '2px solid #36538c' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#36538c' }}>TOTAL</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#36538c' }}>
                        ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* 5. BOTTOM FOOTER NOTICE */}
            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#4b5563' }}>
              If you have any questions about this price quote, please contact<br />
              <strong style={{ color: '#111827' }}>[{user?.name || 'Ramesh Patel'}, {user?.phone || '+91 98765 43210'}, {user?.email || 'apex@traders.com'}]</strong>
              <div style={{ fontStyle: 'italic', fontWeight: 700, color: '#36538c', fontSize: '0.88rem', marginTop: '4px' }}>
                Thank You For Your Business!
              </div>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
};
