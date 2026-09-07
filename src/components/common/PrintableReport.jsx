import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { Printer, Download, CheckCircle, Shield, Building2 } from 'lucide-react';

export const PrintableReport = ({
  isOpen,
  onClose,
  title = "PROJECT & PROCUREMENT STATUS REPORT",
  subtitle = "Central Hostel Inventory & Management System",
  reportCode = `REP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
  date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  author = "Hostel Procurement Directorate",
  overviewText = null,
  metadata = [],
  tableColumns = [],
  tableData = [],
  summaryCards = [],
  showSignatures = true,
  customContent = null,
}) => {
  if (!isOpen) return null;

  // Strict Automatic De-duplication: filter out identical table rows by JSON fingerprint or unique key
  const deduplicatedTableData = useMemo(() => {
    if (!Array.isArray(tableData)) return [];
    const seen = new Set();
    return tableData.filter(row => {
      if (!row) return false;
      const rowKey = row.int_Request_Id || row.int_Purchase_Id || row.int_Product_Id || row.int_Item_Id || row.po_number || row.txt_PO_Code || row.supplier || row.category || JSON.stringify(row);
      if (seen.has(rowKey)) return false;
      seen.add(rowKey);
      return true;
    });
  }, [tableData]);

  const handlePrint = () => {
    window.print();
  };

  const monthYearPill = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`PDF Preview: ${title}`} maxWidth="880px">
      <div className="printable-report" style={{ 
        backgroundColor: '#ffffff', 
        color: '#0f172a', 
        padding: '24px', 
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}>
        
        {/* Official Executive Institution Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingBottom: '16px', 
          borderBottom: '3px solid #1e3a8a',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Institution Badge */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '10px',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.35rem',
              letterSpacing: '-0.5px',
              boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>
              NEC
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                NATIONAL ENGINEERING COLLEGE
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                An Autonomous Institution | K.R. Nagar, Kovilpatti - 628503
              </div>
              <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                Central Hostel Inventory & Procurement System
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{
              padding: '4px 12px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>
              OFFICIAL REPORT
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
              Date: <strong>{date}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
              Ref Code: <strong>{reportCode}</strong>
            </div>
          </div>
        </div>

        {/* Executive Report Title Banner Card */}
        <div style={{
          backgroundColor: '#1e3a8a',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#ffffff' }}>
              {title}
            </h1>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 500, marginTop: '4px' }}>
              {subtitle} {author && `• ${author}`}
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            color: '#1e3a8a',
            padding: '4px 12px',
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}>
            {monthYearPill}
          </div>
        </div>

        {/* Executive Overview Narrative Block */}
        {overviewText && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderLeft: '4px solid #1e3a8a',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            lineHeight: '1.45',
            color: '#334155',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              Executive Overview
            </strong>
            {overviewText}
          </div>
        )}

        {/* Metadata Grid (if any) */}
        {metadata.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metadata.length, 4)}, 1fr)`, gap: '10px', marginBottom: '16px' }}>
            {metadata.map((item, idx) => (
              <div key={idx} style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* KPI / Summary Cards */}
        {summaryCards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(summaryCards.length, 3)}, 1fr)`, gap: '12px', marginBottom: '16px' }}>
            {summaryCards.map((card, idx) => (
              <div key={idx} style={{ 
                padding: '12px 14px', 
                borderRadius: '8px', 
                backgroundColor: card.bg || '#f8fafc', 
                border: `1px solid ${card.border || '#cbd5e1'}`,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: card.color || '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: card.color || '#0f172a', marginTop: '2px' }}>{card.value}</div>
                {card.subtitle && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{card.subtitle}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Custom Content Slot */}
        {customContent}

        {/* Detailed Data Table */}
        {tableColumns.length > 0 && (
          <div style={{ marginTop: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.2px' }}>
                Detailed Report Overview
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                Total Records: <strong>{deduplicatedTableData.length}</strong> (No duplicates)
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th style={{ padding: '8px 10px', border: '1px solid #1e3a8a', textAlign: 'center', width: '40px' }}>#</th>
                  {tableColumns.map((col, idx) => (
                    <th key={idx} style={{ padding: '8px 10px', border: '1px solid #1e3a8a', textAlign: col.align || 'left', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deduplicatedTableData.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length + 1} style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: 500 }}>
                      No data records available for this report.
                    </td>
                  </tr>
                ) : (
                  deduplicatedTableData.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{ 
                      backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}>
                      <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{rowIdx + 1}</td>
                      {tableColumns.map((col, colIdx) => (
                        <td key={colIdx} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', textAlign: col.align || 'left', verticalAlign: 'middle' }}>
                          {col.render ? col.render(row) : row[col.accessor]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Verification & Signature Block */}
        {showSignatures && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '28px', paddingTop: '16px', borderTop: '1.5px dashed #cbd5e1', textAlign: 'center' }}>
            <div>
              <div style={{ minHeight: '32px' }}></div>
              <div style={{ borderTop: '1.5px solid #475569', paddingTop: '4px', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b' }}>
                PREPARED BY
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Store Supervisor / Admin</div>
            </div>

            <div>
              <div style={{ minHeight: '32px' }}></div>
              <div style={{ borderTop: '1.5px solid #475569', paddingTop: '4px', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b' }}>
                VERIFIED BY
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Hostel Warden / Auditor</div>
            </div>

            <div>
              <div style={{ minHeight: '32px' }}></div>
              <div style={{ borderTop: '1.5px solid #475569', paddingTop: '4px', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b' }}>
                APPROVED BY
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Chief Warden / Principal</div>
            </div>
          </div>
        )}

        {/* Footer Document Integrity Note */}
        <div style={{ marginTop: '20px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
          <div>National Engineering College — Central Hostel Inventory Management System</div>
          <div>Computer Generated Official Report | Verified & Certified</div>
        </div>

        {/* Modal Action Controls (Hidden when printing) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Printer size={16} /> Save / Export as PDF
          </button>
        </div>

      </div>
    </Modal>
  );
};


