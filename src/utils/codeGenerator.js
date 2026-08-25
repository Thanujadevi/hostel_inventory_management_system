/**
 * Centralized Code Generator Utility for Hostel Inventory Management System
 * Automatically generates unique, formatted tracking codes for every record in the application.
 */

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Extracts sequence number from code string or returns max ID + 1
 */
const getNextSequence = (list = [], codeField = 'id', prefix = '') => {
  if (!Array.isArray(list) || list.length === 0) return 1;

  let maxNum = 0;
  list.forEach(item => {
    // Try code field first, then fallback to ID
    const codeVal = item[codeField] || item.id || item.int_Store_Id || item.int_Supplier_Id || item.int_Category_Id || item.int_Item_Id || item.int_Request_Id || item.int_Quotation_Id || item.int_Purchase_Id || item.int_Payment_Id || 0;
    
    if (typeof codeVal === 'number') {
      if (codeVal > maxNum) maxNum = codeVal;
    } else if (typeof codeVal === 'string') {
      const match = codeVal.match(/\d+/g);
      if (match) {
        const lastNum = parseInt(match[match.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > maxNum) {
          maxNum = lastNum;
        }
      }
    }
  });

  return maxNum + 1;
};

/**
 * Store Code Generator: e.g. STR-2026-001
 */
export const generateStoreCode = (stores = []) => {
  const seq = getNextSequence(stores, 'txt_Store_Code');
  return `STR-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Supplier Code Generator: e.g. SUP-2026-001
 */
export const generateSupplierCode = (suppliers = []) => {
  const seq = getNextSequence(suppliers, 'txt_Supplier_Code');
  return `SUP-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Category Code Generator: e.g. CAT-2026-001
 */
export const generateCategoryCode = (categories = []) => {
  const seq = getNextSequence(categories, 'txt_Category_Code');
  return `CAT-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Item Code Generator: e.g. ITM-2026-001
 */
export const generateItemCode = (items = []) => {
  const seq = getNextSequence(items, 'txt_Item_Code');
  return `ITM-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Requirement / Request Code Generator: e.g. REQ-2026-001
 */
export const generateRequestCode = (requests = []) => {
  const seq = getNextSequence(requests, 'txt_Request_No');
  return `REQ-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Quotation Code Generator: e.g. QTN-2026-001
 */
export const generateQuotationCode = (quotations = []) => {
  const seq = getNextSequence(quotations, 'txt_Quotation_No');
  return `QTN-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Purchase Order (PO) Code Generator: e.g. PO-2026-001
 */
export const generatePOCode = (purchases = []) => {
  const seq = getNextSequence(purchases, 'po_number');
  return `PO-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};

/**
 * Payment Code Generator: e.g. PAY-2026-001
 */
export const generatePaymentCode = (payments = []) => {
  const seq = getNextSequence(payments, 'txt_Payment_No');
  return `PAY-${CURRENT_YEAR}-${String(seq).padStart(3, '0')}`;
};
