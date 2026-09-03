import {
  generateStoreCode,
  generateSupplierCode,
  generateCategoryCode,
  generateItemCode,
  generateRequestCode,
  generateQuotationCode,
  generatePOCode,
  generatePaymentCode
} from '../utils/codeGenerator';

const initialSeedData = {
  tbl_Admin: [
    {
      int_Admin_Id: 1,
      txt_Admin_Code: "ADM001",
      txt_Admin_Name: "Chief Warden / Admin",
      txt_Email: "24104063@nec.edu.in",
      txt_Password: "admin",
      txt_Role: "Chief Warden / Admin",
      txt_Active: "Y",
      dte_Created_Date: "2026-08-31",
      txt_Created_By: "System",
      dte_Updated_Date: "2026-08-31",
      txt_Updated_By: "System"
    }
  ],
  tbl_Store: [
    { int_Store_Id: 1, txt_Store_Code: 'STO001', txt_Store_Name: 'Boys Hostel Store 1', txt_Location: 'Block A Ground Floor', txt_Incharge_Name: 'Ramesh Kumar', txt_Phone: '9876543210', txt_Email: 'store1@hostel.edu' }
  ],
  tbl_Supplier: [
    { int_Supplier_Id: 1, txt_Supplier_Code: 'SUP001', txt_Supplier_Name: 'Global Supplies', txt_Store_Name: 'Global Supplies', txt_Phone: '9876501234', txt_Email: 'global@supplies.com', txt_City: 'Coimbatore', txt_State: 'Tamil Nadu', txt_GST: '33BBBCA5678B1Z2' },
    { int_Supplier_Id: 2, txt_Supplier_Code: 'SUP002', txt_Supplier_Name: 'Apex Traders', txt_Store_Name: 'Apex Traders', txt_Phone: '9988776655', txt_Email: 'apex@traders.com', txt_City: 'Chennai', txt_State: 'Tamil Nadu', txt_GST: '33AAACA1234A1Z5' }
  ],
  tbl_Category: [
    { int_Category_Id: 1, txt_Category_Code: 'CAT001', txt_Category_Name: 'Bedding & Furniture' },
    { int_Category_Id: 2, txt_Category_Code: 'CAT002', txt_Category_Name: 'Electricals & Plumbing' }
  ],
  tbl_Item: [
    { int_Item_Id: 1, txt_Item_Code: 'ITM001', txt_Item_Name: 'Single Cot Mattress 6x3', int_Category_Id: 1, txt_Category_Name: 'Bedding & Furniture', dec_Unit_Price: 2500, txt_Unit: 'Nos', int_quantity_in_hand: 50 },
    { int_Item_Id: 2, txt_Item_Code: 'ITM002', txt_Item_Name: 'LED Tube Light 20W', int_Category_Id: 2, txt_Category_Name: 'Electricals & Plumbing', dec_Unit_Price: 350, txt_Unit: 'Nos', int_quantity_in_hand: 120 }
  ],
  tbl_Inventory_Request: [
    { int_Request_Id: 1, txt_Request_No: 'REQ-0001', int_Store_Id: 1, store_name: 'Boys Hostel Store 1', txt_Status: 'PO Issued', dte_Request_Date: '2026-08-25', txt_Period: 'August 2026', dec_Est_Budget: 25000 },
    { int_Request_Id: 2, txt_Request_No: 'REQ-0002', int_Store_Id: 1, store_name: 'Boys Hostel Store 1', txt_Status: 'PO Issued', dte_Request_Date: '2026-08-28', txt_Period: 'August 2026', dec_Est_Budget: 15000 }
  ],
  tbl_Request_Item: [],
  tbl_Quotation: [
    { int_Quotation_Id: 1, txt_Quotation_Code: 'QTN-001', int_Request_Id: 1, int_Supplier_Id: 1, supplierName: 'Global Supplies', dec_Total_Amount: 4700, dec_Transport_Cost: 500, int_Delivery_Days: 3, txt_Status: 'Approved' },
    { int_Quotation_Id: 2, txt_Quotation_Code: 'QTN-002', int_Request_Id: 2, int_Supplier_Id: 1, supplierName: 'Global Supplies', dec_Total_Amount: 4700, dec_Transport_Cost: 500, int_Delivery_Days: 3, txt_Status: 'Approved' }
  ],
  tbl_Quotation_Item: [],
  tbl_Purchase: [
    { 
      int_Purchase_Id: 1, 
      txt_PO_Code: 'PO-2026-001', 
      po_number: 'PO-2026-001', 
      int_Quotation_Id: 1, 
      int_Request_Id: 1, 
      int_Supplier_Id: 1, 
      int_Store_Id: 1, 
      supplier_name: 'Global Supplies', 
      supplier_phone: '9876501234', 
      store_name: 'Boys Hostel Store 1', 
      request_no: 'REQ-0001', 
      dte_Purchase_Date: '2026-08-28', 
      dte_PO_Date: '2026-08-28', 
      dec_Final_Amount: 5200, 
      dbl_Total_Amount: 5200, 
      quotation_amount: 4700, 
      transport_cost: 500, 
      delivery_days: 3, 
      txt_Status: 'PO Issued' 
    },
    { 
      int_Purchase_Id: 2, 
      txt_PO_Code: 'PO-2026-002', 
      po_number: 'PO-2026-002', 
      int_Quotation_Id: 2, 
      int_Request_Id: 2, 
      int_Supplier_Id: 1, 
      int_Store_Id: 1, 
      supplier_name: 'Global Supplies', 
      supplier_phone: '9876501234', 
      store_name: 'Boys Hostel Store 1', 
      request_no: 'REQ-0002', 
      dte_Purchase_Date: '2026-09-01', 
      dte_PO_Date: '2026-09-01', 
      dec_Final_Amount: 5200, 
      dbl_Total_Amount: 5200, 
      quotation_amount: 4700, 
      transport_cost: 500, 
      delivery_days: 3, 
      txt_Status: 'PO Issued' 
    }
  ],
  tbl_Payment: [
    {
      int_Payment_Id: 1,
      txt_Payment_No: 'PAY-2026-001',
      int_Purchase_Id: 1,
      dte_Payment_Date: '2026-08-30',
      dec_Payment_Amount: 5200,
      dbl_Amount: 5200,
      txt_Payment_Mode: 'NEFT Bank Transfer',
      txt_Transaction_Id: 'TXN88492019',
      txt_Payment_Status: 'Completed',
      txt_Remarks: 'Full payment released upon store receipt confirmation'
    }
  ],
  tbl_Requirement_Period: { txt_Period: 'August 2026', txt_Status: 'OPEN', dte_Deadline: '2026-09-15' }
};

const STORAGE_KEY = 'hostel_ims_db_v14_payments_seeded';

// Helper to get database from localStorage or seed
const getDB = () => {
  // Clear legacy storage keys across all previous versions
  try {
    localStorage.removeItem('hostel_ims_db_v12_seeded');
    localStorage.removeItem('hostel_ims_db_v10_purged');
    localStorage.removeItem('hostel_ims_db_v9_synced');
    localStorage.removeItem('hostel_ims_db_v8');
    localStorage.removeItem('hostel_ims_db_v7');
    localStorage.removeItem('hostel_ims_db_v6');
    localStorage.removeItem('hostel_ims_db_v5');
    localStorage.removeItem('hostel_ims_db_v4');
    localStorage.removeItem('hostel_ims_db_v3');
    localStorage.removeItem('hostel_ims_db_v2');
    localStorage.removeItem('hostel_ims_db_v1');
  } catch (e) {}

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData));
    return initialSeedData;
  }
  try {
    const db = JSON.parse(data);
    if (!db.tbl_Purchase || !Array.isArray(db.tbl_Purchase) || db.tbl_Purchase.length === 0) {
      db.tbl_Purchase = initialSeedData.tbl_Purchase;
      saveDB(db);
    }
    return db;
  } catch (e) {
    console.error("Failed to parse local storage DB, resetting to seed:", e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData));
    return initialSeedData;
  }
};

// Helper to save DB to localStorage
const saveDB = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// Express MySQL API Endpoint
const API_BASE = 'http://localhost:5000/api';

const apiFetch = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

// Artificial delay helper (set to 0 for instant response)
const delay = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Reset DB to seed
  resetToSeed: async () => {
    await delay(100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData));
    return initialSeedData;
  },

  // STORES API (tbl_Store)
  getStores: async () => {
    const apiRes = await apiFetch('/stores');
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    return db.tbl_Store || [];
  },

  saveStore: async (storeData) => {
    const apiRes = await apiFetch('/stores', { method: 'POST', body: JSON.stringify(storeData) });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    if (storeData.int_Store_Id) {
      // Update
      const index = db.tbl_Store.findIndex(s => s.int_Store_Id === storeData.int_Store_Id);
      if (index !== -1) {
        db.tbl_Store[index] = {
          ...db.tbl_Store[index],
          ...storeData,
          txt_Active: storeData.txt_Active || db.tbl_Store[index].txt_Active || 'Y',
          txt_Password: storeData.txt_Password || db.tbl_Store[index].txt_Password || 'storepassword',
          txt_Username: storeData.txt_Username || db.tbl_Store[index].txt_Username || `store${storeData.int_Store_Id}`,
          dte_Updated_Date: new Date().toISOString().split('T')[0]
        };
      }
    } else {
      // Create new
      const newId = Math.max(...db.tbl_Store.map(s => s.int_Store_Id || 0), 0) + 1;
      const storeCode = storeData.txt_Store_Code || generateStoreCode(db.tbl_Store);
      const newStore = {
        ...storeData,
        int_Store_Id: newId,
        txt_Store_Code: storeCode,
        txt_Username: storeData.txt_Username || storeCode.toLowerCase(),
        txt_Password: storeData.txt_Password || 'storepassword',
        txt_Active: storeData.txt_Active || 'Y',
        dte_Created_Date: new Date().toISOString().split('T')[0],
        txt_Created_By: 'ADM001',
        dte_Updated_Date: new Date().toISOString().split('T')[0],
        txt_Updated_By: 'ADM001'
      };
      db.tbl_Store.push(newStore);
    }
    saveDB(db);
    return db.tbl_Store;
  },

  deleteStore: async (storeId) => {
    const apiRes = await apiFetch(`/stores/${storeId}`, { method: 'DELETE' });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    db.tbl_Store = db.tbl_Store.filter(s => s.int_Store_Id !== storeId);
    saveDB(db);
    return db.tbl_Store;
  },

  // SUPPLIERS API (tbl_Supplier)
  getSuppliers: async () => {
    const apiRes = await apiFetch('/suppliers');
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    return db.tbl_Supplier || [];
  },

  saveSupplier: async (supplierData) => {
    const apiRes = await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(supplierData) });
    const db = getDB();
    if (apiRes && Array.isArray(apiRes)) {
      db.tbl_Supplier = apiRes;
      saveDB(db);
      return apiRes;
    }
    await delay();
    if (supplierData.int_Supplier_Id) {
      const index = db.tbl_Supplier.findIndex(s => s.int_Supplier_Id === supplierData.int_Supplier_Id);
      if (index !== -1) {
        db.tbl_Supplier[index] = {
          ...db.tbl_Supplier[index],
          ...supplierData,
          txt_Store_Name: supplierData.txt_Store_Name || supplierData.txt_Supplier_Name || db.tbl_Supplier[index].txt_Store_Name,
          txt_Owner_Name: supplierData.txt_Owner_Name || supplierData.txt_Contact_Person || db.tbl_Supplier[index].txt_Owner_Name,
          txt_Supplier_Name: supplierData.txt_Supplier_Name || supplierData.txt_Store_Name || db.tbl_Supplier[index].txt_Supplier_Name,
          txt_Contact_Person: supplierData.txt_Contact_Person || supplierData.txt_Owner_Name || db.tbl_Supplier[index].txt_Contact_Person,
          dte_Updated_Date: new Date().toISOString().split('T')[0]
        };
      }
    } else {
      const newId = Math.max(...db.tbl_Supplier.map(s => s.int_Supplier_Id || 0), 0) + 1;
      const storeName = supplierData.txt_Store_Name || supplierData.txt_Supplier_Name || '';
      const ownerName = supplierData.txt_Owner_Name || supplierData.txt_Contact_Person || '';
      const newSupplier = {
        ...supplierData,
        int_Supplier_Id: newId,
        txt_Supplier_Code: supplierData.txt_Supplier_Code || generateSupplierCode(db.tbl_Supplier),
        txt_Store_Name: storeName,
        txt_Owner_Name: ownerName,
        txt_Supplier_Name: storeName,
        txt_Contact_Person: ownerName,
        dbl_Rating: supplierData.dbl_Rating !== undefined ? Number(supplierData.dbl_Rating) : 0,
        txt_Active: supplierData.txt_Active || 'Y',
        txt_Profile_Completed: supplierData.txt_Profile_Completed !== undefined ? supplierData.txt_Profile_Completed : 'N',
        txt_Country: supplierData.txt_Country || 'India',
        dte_Created_Date: new Date().toISOString().split('T')[0],
        txt_Created_By: 'ADM001',
        dte_Updated_Date: new Date().toISOString().split('T')[0],
        txt_Updated_By: 'ADM001'
      };
      db.tbl_Supplier.push(newSupplier);
    }
    saveDB(db);
    return db.tbl_Supplier;
  },

  rateSupplier: async (supplierIdOrName, newRating) => {
    await delay();
    const db = getDB();
    const target = String(supplierIdOrName || '').toLowerCase();
    const supplier = db.tbl_Supplier.find(s => 
      s.int_Supplier_Id === Number(supplierIdOrName) || 
      (s.txt_Store_Name && s.txt_Store_Name.toLowerCase() === target) ||
      (s.txt_Supplier_Name && s.txt_Supplier_Name.toLowerCase() === target)
    );
    if (supplier) {
      const currentRating = Number(supplier.dbl_Rating || 0);
      const ratingCount = Number(supplier.int_Rating_Count || (currentRating > 0 ? 1 : 0));
      const totalScore = (currentRating * ratingCount) + Number(newRating);
      const newCount = ratingCount + 1;
      const avgRating = Math.round((totalScore / newCount) * 10) / 10;
      
      supplier.dbl_Rating = avgRating;
      supplier.int_Rating_Count = newCount;
      saveDB(db);
    }
    return db.tbl_Supplier;
  },

  deleteSupplier: async (supplierId) => {
    const apiRes = await apiFetch(`/suppliers/${supplierId}`, { method: 'DELETE' });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    db.tbl_Supplier = db.tbl_Supplier.filter(s => s.int_Supplier_Id !== supplierId);
    saveDB(db);
    return db.tbl_Supplier;
  },

  // CATEGORIES API (tbl_Category)
  getCategories: async () => {
    const apiRes = await apiFetch('/categories');
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    return db.tbl_Category || [];
  },

  saveCategory: async (categoryData) => {
    const apiRes = await apiFetch('/categories', { method: 'POST', body: JSON.stringify(categoryData) });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    if (categoryData.int_Category_Id) {
      const index = db.tbl_Category.findIndex(c => c.int_Category_Id === categoryData.int_Category_Id);
      if (index !== -1) {
        db.tbl_Category[index] = {
          ...db.tbl_Category[index],
          ...categoryData,
          dte_Updated_Date: new Date().toISOString().split('T')[0]
        };
      }
    } else {
      const newId = Math.max(...db.tbl_Category.map(c => c.int_Category_Id || 0), 0) + 1;
      const newCat = {
        ...categoryData,
        int_Category_Id: newId,
        txt_Category_Code: categoryData.txt_Category_Code || generateCategoryCode(db.tbl_Category),
        txt_status: categoryData.txt_status || 'Active',
        dte_Created_Date: new Date().toISOString().split('T')[0],
        txt_Created_By: 'ADM001',
        dte_Updated_Date: new Date().toISOString().split('T')[0],
        txt_Updated_By: 'ADM001'
      };
      db.tbl_Category.push(newCat);
    }
    saveDB(db);
    return db.tbl_Category;
  },

  deleteCategory: async (catId) => {
    const apiRes = await apiFetch(`/categories/${catId}`, { method: 'DELETE' });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    db.tbl_Category = db.tbl_Category.filter(c => c.int_Category_Id !== catId);
    saveDB(db);
    return db.tbl_Category;
  },

  // ITEMS API (tbl_Item & tbl_Store_Stock)
  getItems: async (storeId = null) => {
    const apiRes = await apiFetch('/items');
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    const items = db.tbl_Item || [];
    if (!storeId) return items;

    db.tbl_Store_Stock = db.tbl_Store_Stock || {};
    const storeStockMap = db.tbl_Store_Stock[storeId] || {};

    return items.map(item => ({
      ...item,
      int_quantity_in_hand: storeStockMap[item.int_Item_Id] !== undefined
        ? Number(storeStockMap[item.int_Item_Id])
        : Number(item.int_quantity_in_hand || 0)
    }));
  },

  saveItem: async (itemData) => {
    const apiRes = await apiFetch('/items', { method: 'POST', body: JSON.stringify(itemData) });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    if (itemData.int_Item_Id) {
      const index = db.tbl_Item.findIndex(i => i.int_Item_Id === itemData.int_Item_Id);
      if (index !== -1) {
        db.tbl_Item[index] = {
          ...db.tbl_Item[index],
          ...itemData
        };
      }
    } else {
      const newId = Math.max(...db.tbl_Item.map(i => i.int_Item_Id || 0), 0) + 1;
      const newItem = {
        ...itemData,
        int_Item_Id: newId,
        txt_Item_Code: itemData.txt_Item_Code || generateItemCode(db.tbl_Item),
        txt_Active: itemData.txt_Active || 'Y',
        int_quantity_in_hand: Number(itemData.int_quantity_in_hand || 0),
        dte_Created_Date: new Date().toISOString().split('T')[0],
        txt_Created_By: 'ADM001'
      };
      db.tbl_Item.push(newItem);
    }
    saveDB(db);
    return db.tbl_Item;
  },

  deleteItem: async (itemId) => {
    const apiRes = await apiFetch(`/items/${itemId}`, { method: 'DELETE' });
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    await delay();
    const db = getDB();
    db.tbl_Item = db.tbl_Item.filter(i => i.int_Item_Id !== itemId);
    saveDB(db);
    return db.tbl_Item;
  },

  // INVENTORY REQUIREMENTS API (tbl_Inventory_Request & tbl_Request_Item)
  getRequests: async () => {
    const apiRes = await apiFetch('/requirements');
    if (apiRes && Array.isArray(apiRes)) return apiRes;
    // Deduplicate requirement rows by txt_Request_Code / int_Request_Id
    const uniqueMap = new Map();
    (db.tbl_Inventory_Request || []).forEach(req => {
      const codeKey = req.txt_Request_Code || req.txt_Request_No || `REQ-${req.int_Request_Id}`;
      if (!uniqueMap.has(codeKey) && !uniqueMap.has(String(req.int_Request_Id))) {
        uniqueMap.set(codeKey, req);
      }
    });
    const requests = Array.from(uniqueMap.values());
    const requestItems = db.tbl_Request_Item || [];
    const items = db.tbl_Item || [];
    const stores = db.tbl_Store || [];

    // Join items & store detail
    return requests.map(req => {
      const reqItems = requestItems
        .filter(ri => Number(ri.int_Request_Id) === Number(req.int_Request_Id))
        .map(ri => {
          const product = items.find(i => Number(i.int_Item_Id) === Number(ri.int_Product_Id || ri.int_Item_Id));
          const qty = Number(ri.dec_Required_Qty || ri.int_Requested_Quantity || ri.int_Quantity || ri.quantity || 0);
          return {
            ...ri,
            int_Product_Id: ri.int_Product_Id || ri.int_Item_Id,
            int_Item_Id: ri.int_Item_Id || ri.int_Product_Id,
            dec_Required_Qty: qty,
            int_Requested_Quantity: qty,
            int_Quantity: qty,
            product_code: product ? product.txt_Item_Code : (ri.product_code || ri.txt_Item_Code || ''),
            txt_Item_Code: product ? product.txt_Item_Code : (ri.txt_Item_Code || ri.product_code || ''),
            product_name: product ? product.txt_Item_Name : (ri.product_name || ri.txt_Item_Name || `Product #${ri.int_Item_Id || ri.int_Product_Id}`),
            txt_Item_Name: product ? product.txt_Item_Name : (ri.txt_Item_Name || ri.product_name || `Product #${ri.int_Item_Id || ri.int_Product_Id}`),
            category: product ? (product.txt_Category || product.category || 'General') : (ri.category || ri.txt_Category || 'General'),
            txt_Category: product ? (product.txt_Category || product.category || 'General') : (ri.txt_Category || ri.category || 'General'),
            brand: product ? product.txt_Brand : (ri.brand || ri.txt_Brand || 'Standard'),
            txt_Brand: product ? product.txt_Brand : (ri.txt_Brand || ri.brand || 'Standard'),
            unit: product ? product.txt_Unit : (ri.unit || ri.txt_Unit || 'Pcs'),
            txt_Unit: product ? product.txt_Unit : (ri.txt_Unit || ri.unit || 'Pcs')
          };
        });
      const store = stores.find(s => Number(s.int_Store_Id) === Number(req.int_Store_Id));
      return {
        ...req,
        store_name: store ? store.txt_Store_Name : (req.store_name || req.txt_Store_Name || 'Hostel Store'),
        items: reqItems
      };
    });
  },

  createRequirement: async (reqData, reqItems) => {
    const payload = {
      int_Store_Id: reqData.int_Store_Id,
      txt_Priority: reqData.txt_Priority || 'Medium',
      txt_Remarks: reqData.txt_Remarks || '',
      items: (reqItems || []).map(i => ({ int_Item_Id: i.int_Product_Id || i.int_Item_Id, int_Quantity: i.dec_Required_Qty || i.int_Quantity || 1 }))
    };
    const apiRes = await apiFetch('/requirements', { method: 'POST', body: JSON.stringify(payload) });
    if (apiRes && (apiRes.success || apiRes.int_Request_Id)) return apiRes;
    await delay();
    const db = getDB();
    
    // Check for existing pending request for this store
    let storeReq = db.tbl_Inventory_Request.find(r => Number(r.int_Store_Id) === Number(reqData.int_Store_Id) && (r.txt_Status === 'Pending' || r.txt_Status === 'Pending Approval'));
    
    let newReqId;
    if (storeReq) {
      newReqId = storeReq.int_Request_Id;
      storeReq.dec_Budget = Number(reqData.dec_Budget || 0);
      storeReq.txt_Remarks = reqData.txt_Remarks || storeReq.txt_Remarks;
      db.tbl_Request_Item = db.tbl_Request_Item.filter(ri => Number(ri.int_Request_Id) !== Number(newReqId));
    } else {
      newReqId = Math.max(...db.tbl_Inventory_Request.map(r => r.int_Request_Id || 0), 0) + 1;
      const reqNo = reqData.txt_Request_No || generateRequestCode(db.tbl_Inventory_Request);
      storeReq = {
        int_Request_Id: newReqId,
        txt_Request_No: reqNo,
        int_Store_Id: reqData.int_Store_Id,
        dte_Request_Date: new Date().toISOString().split('T')[0],
        txt_Month: reqData.txt_Month || 'August',
        int_Year: reqData.int_Year || 2026,
        dec_Budget: Number(reqData.dec_Budget || 0),
        txt_Status: 'Pending Approval',
        int_Admin_Id: 1,
        txt_Remarks: reqData.txt_Remarks || '',
        dte_Created_Date: new Date().toISOString().split('T')[0]
      };
      db.tbl_Inventory_Request.push(storeReq);
    }

    // Save request items
    let nextReqItemId = Math.max(...(db.tbl_Request_Item || []).map(ri => ri.int_Request_Item_Id || 0), 0) + 1;
    const itemsList = db.tbl_Item || [];
    const storesList = db.tbl_Store || [];
    const storeObj = storesList.find(s => Number(s.int_Store_Id) === Number(reqData.int_Store_Id));
    storeReq.store_name = storeObj ? storeObj.txt_Store_Name : (reqData.store_name || 'Hostel Store');

    const populatedItems = reqItems.map(item => {
      const pId = Number(item.int_Product_Id || item.int_Item_Id);
      const masterProduct = itemsList.find(i => Number(i.int_Item_Id) === pId);
      const qty = Number(item.dec_Required_Qty || item.int_Quantity || item.int_Requested_Quantity || 1);
      const riObj = {
        int_Request_Item_Id: nextReqItemId++,
        int_Request_Id: newReqId,
        int_Product_Id: pId,
        int_Item_Id: pId,
        dec_Required_Qty: qty,
        int_Quantity: qty,
        int_Requested_Quantity: qty,
        product_code: masterProduct ? masterProduct.txt_Item_Code : (item.product_code || item.txt_Item_Code || `PRD-00${pId}`),
        txt_Item_Code: masterProduct ? masterProduct.txt_Item_Code : (item.txt_Item_Code || item.product_code || `PRD-00${pId}`),
        product_name: masterProduct ? masterProduct.txt_Item_Name : (item.product_name || item.txt_Item_Name || `Product #${pId}`),
        txt_Item_Name: masterProduct ? masterProduct.txt_Item_Name : (item.txt_Item_Name || item.product_name || `Product #${pId}`),
        category: masterProduct ? (masterProduct.txt_Category || masterProduct.category || masterProduct.txt_Category_Name || 'General') : (item.category || item.txt_Category || 'General'),
        unit: masterProduct ? masterProduct.txt_Unit : (item.unit || item.txt_Unit || 'Pcs'),
        txt_Unit: masterProduct ? masterProduct.txt_Unit : (item.txt_Unit || item.unit || 'Pcs'),
        txt_Remarks: item.txt_Remarks || ''
      };
      db.tbl_Request_Item.push(riObj);
      return riObj;
    });

    storeReq.items = populatedItems;
    saveDB(db);
    return storeReq;
  },

  updateRequestStatus: async (requestId, status, adminRemarks = '') => {
    const apiRes = await apiFetch(`/requirements/${requestId}/status`, { method: 'PATCH', body: JSON.stringify({ txt_Status: status, txt_Remarks: adminRemarks }) });
    const db = getDB();
    const req = db.tbl_Inventory_Request.find(r => Number(r.int_Request_Id) === Number(requestId));
    if (req) {
      req.txt_Status = status;
      if (adminRemarks) req.txt_Remarks = adminRemarks;
      saveDB(db);
    }
    if (apiRes && apiRes.success) return apiRes;
    await delay();
    return req;
  },

  deleteRequirement: async (requestId) => {
    const apiRes = await apiFetch(`/requirements/${requestId}`, { method: 'DELETE' }).catch(() => null);
    const db = getDB();
    db.tbl_Inventory_Request = (db.tbl_Inventory_Request || []).filter(r => 
      Number(r.int_Request_Id) !== Number(requestId) && 
      String(r.txt_Request_Code) !== String(requestId) &&
      String(r.txt_Request_No) !== String(requestId)
    );
    db.tbl_Request_Item = (db.tbl_Request_Item || []).filter(ri => Number(ri.int_Request_Id) !== Number(requestId));
    saveDB(db);
    return apiRes || { success: true };
  },

  getQuotations: async (requestId = null) => {
    const apiRes = await apiFetch('/quotations');
    if (apiRes && Array.isArray(apiRes)) {
      if (requestId) return apiRes.filter(q => q.int_Request_Id === Number(requestId));
      return apiRes;
    }
    await delay();
    const db = getDB();

    let quotes = db.tbl_Quotation || [];
    if (requestId) {
      quotes = quotes.filter(q => q.int_Request_Id === Number(requestId));
    }
    const suppliers = db.tbl_Supplier || [];
    const quoteItems = db.tbl_Quotation_Item || [];
    const items = db.tbl_Item || [];

    return quotes.map(q => {
      const supplier = suppliers.find(s => s.int_Supplier_Id === q.int_Supplier_Id);
      const itemsList = quoteItems
        .filter(qi => qi.int_Quotation_Id === q.int_Quotation_Id)
        .map(qi => {
          const pId = qi.int_Product_Id || qi.int_Item_Id;
          const product = items.find(i => i.int_Item_Id === pId);
          const isAvailable = qi.is_available !== false && Number(qi.dec_Unit_Price || 0) > 0;
          return {
            ...qi,
            int_Product_Id: pId,
            is_available: isAvailable,
            product_name: product ? product.txt_Item_Name : `Item #${pId}`,
            product_code: product ? product.txt_Item_Code : ''
          };
        });

      return {
        ...q,
        txt_Quotation_No: q.txt_Quotation_No || `QTN-2026-${String(q.int_Quotation_Id).padStart(3, '0')}`,
        supplier_name: supplier ? (supplier.txt_Store_Name || supplier.txt_Supplier_Name || 'Supplier') : (q.supplier_name || q.txt_Store_Name || q.txt_Supplier_Name || 'Supplier'),
        supplier_owner: supplier ? (supplier.txt_Owner_Name || supplier.txt_Contact_Person || '') : (q.supplier_owner || q.txt_Owner_Name || q.txt_Contact_Person || ''),
        supplier_rating: supplier ? Number(supplier.dbl_Rating || 0) : Number(q.supplier_rating || q.dbl_Rating || 0),
        supplier_phone: supplier ? (supplier.txt_Phone || '') : (q.supplier_phone || q.txt_Phone || ''),
        supplier_email: supplier ? (supplier.txt_Email || '') : (q.supplier_email || q.txt_Email || ''),
        supplier_gst: supplier ? (supplier.txt_GST_Number || supplier.txt_GSTIN || '') : (q.supplier_gst || q.txt_GST_Number || q.txt_GSTIN || ''),
        supplier_city: supplier ? (supplier.txt_City || '') : (q.txt_City || ''),
        supplier_state: supplier ? (supplier.txt_State || '') : (q.txt_State || ''),
        items: itemsList
      };
    });
  },

  clearSupplierAndRequestsData: async () => {
    await delay(100);
    const db = getDB();
    db.tbl_Inventory_Request = [];
    db.tbl_Request_Item = [];
    db.tbl_Quotation = [];
    db.tbl_Quotation_Item = [];
    db.tbl_Purchase = [];
    db.tbl_Payment = [];
    db.tbl_Supplier = [];
    saveDB(db);
    return db;
  },

  submitQuotation: async (quotationData, itemsList) => {
    let totalItemsAmt = 0;
    (itemsList || []).forEach(item => {
      const isAvail = item.is_available !== false && Number(item.dec_Unit_Price || 0) > 0;
      if (isAvail) {
        totalItemsAmt += (Number(item.dec_Unit_Price) * Number(item.dec_Available_Qty || 1));
      }
    });
    const payload = {
      int_Request_Id: Number(quotationData.int_Request_Id),
      int_Supplier_Id: Number(quotationData.int_Supplier_Id),
      dbl_Total_Amount: totalItemsAmt,
      txt_Delivery_Days: quotationData.int_Delivery_Days ? `${quotationData.int_Delivery_Days} Days` : '3 Days',
      txt_Payment_Terms: quotationData.txt_Remarks || 'Standard Terms',
      items: (itemsList || []).map(i => {
        const isAvail = i.is_available !== false && Number(i.dec_Unit_Price || 0) > 0;
        const uPrice = isAvail ? Number(i.dec_Unit_Price) : 0;
        const qty = Number(i.dec_Available_Qty || 1);
        return {
          int_Item_Id: i.int_Product_Id || i.int_Item_Id,
          int_Quantity: qty,
          dbl_Unit_Price: uPrice,
          dbl_Total_Price: uPrice * qty,
          is_available: isAvail
        };
      })
    };
    const apiRes = await apiFetch('/quotations', { method: 'POST', body: JSON.stringify(payload) });
    if (apiRes && apiRes.success) return apiRes;
    await delay();
    const db = getDB();
    const newQId = Math.max(...db.tbl_Quotation.map(q => q.int_Quotation_Id || 0), 0) + 1;

    const newQuotation = {
      int_Quotation_Id: newQId,
      txt_Quotation_No: quotationData.txt_Quotation_No || generateQuotationCode(db.tbl_Quotation),
      int_Request_Id: Number(quotationData.int_Request_Id),
      int_Supplier_Id: Number(quotationData.int_Supplier_Id),
      dte_Submission_Date: new Date().toISOString().split('T')[0],
      dec_Total_Amount: totalItemsAmt,
      dec_Transport_Cost: Number(quotationData.dec_Transport_Cost || 0),
      int_Delivery_Days: Number(quotationData.int_Delivery_Days || 3),
      txt_Status: 'Submitted',
      txt_Remarks: quotationData.txt_Remarks || ''
    };

    db.tbl_Quotation.push(newQuotation);

    let nextQItemId = Math.max(...(db.tbl_Quotation_Item || []).map(qi => qi.int_Quotation_Item_Id || 0), 0) + 1;
    itemsList.forEach(item => {
      const isAvail = item.is_available !== false && Number(item.dec_Unit_Price || 0) > 0;
      const uPrice = isAvail ? Number(item.dec_Unit_Price) : 0;
      const qty = Number(item.dec_Available_Qty || 1);
      db.tbl_Quotation_Item.push({
        int_Quotation_Item_Id: nextQItemId++,
        int_Quotation_Id: newQId,
        int_Product_Id: Number(item.int_Product_Id),
        dec_Unit_Price: uPrice,
        dec_Available_Qty: qty,
        dec_Total_Price: uPrice * qty,
        is_available: isAvail
      });
    });

    saveDB(db);
    return newQuotation;
  },

  // APPROVE QUOTATION & GENERATE PURCHASE ORDER (tbl_Purchase)
  approveQuotationAndGeneratePO: async (quotationId) => {
    await delay();
    const db = getDB();
    const quotations = db.tbl_Quotation || [];
    const quotation = quotations.find(q => q.int_Quotation_Id === quotationId);
    
    if (quotation) quotation.txt_Status = 'Approved';

    const reqId = quotation ? quotation.int_Request_Id : 1;
    const requirement = (db.tbl_Inventory_Request || []).find(r => r.int_Request_Id === reqId);
    if (requirement) {
      requirement.txt_Status = 'PO Issued';
    }

    const supplier = quotation ? (db.tbl_Supplier || []).find(s => s.int_Supplier_Id === quotation.int_Supplier_Id) : null;
    const store = requirement ? (db.tbl_Store || []).find(s => s.int_Store_Id === requirement.int_Store_Id) : null;

    const existingPOs = db.tbl_Purchase || [];
    const newPOId = Math.max(...existingPOs.map(p => p.int_Purchase_Id || 0), 0) + 1;
    const finalAmt = quotation 
      ? (Number(quotation.dec_Total_Amount || quotation.grandTotal || 0) + Number(quotation.dec_Transport_Cost || 0))
      : 5200;
    const poNum = generatePOCode(existingPOs);

    const newPO = {
      int_Purchase_Id: newPOId,
      txt_PO_Code: poNum,
      po_number: poNum,
      int_Quotation_Id: quotationId,
      int_Request_Id: reqId,
      int_Supplier_Id: quotation ? quotation.int_Supplier_Id : 1,
      int_Store_Id: requirement ? requirement.int_Store_Id : 1,
      supplier_name: supplier ? (supplier.txt_Supplier_Name || supplier.txt_Store_Name) : 'Global Supplies',
      supplier_phone: supplier ? supplier.txt_Phone : '+91 98765 01234',
      store_name: store ? store.txt_Store_Name : 'Main Hostel Store',
      request_no: requirement ? requirement.txt_Request_No : 'REQ-0002',
      dte_Purchase_Date: new Date().toISOString().split('T')[0],
      dte_PO_Date: new Date().toISOString().split('T')[0],
      dec_Final_Amount: finalAmt,
      dbl_Total_Amount: finalAmt,
      quotation_amount: quotation ? quotation.dec_Total_Amount : finalAmt,
      transport_cost: quotation ? quotation.dec_Transport_Cost : 0,
      delivery_days: quotation ? quotation.int_Delivery_Days : 3,
      txt_Status: 'PO Issued',
      txt_Remarks: `PO generated from winning Quotation #${quotationId}`
    };

    db.tbl_Purchase = db.tbl_Purchase || [];
    db.tbl_Purchase.push(newPO);

    apiFetch('/purchases', {
      method: 'POST',
      body: JSON.stringify({
        int_Quotation_Id: quotationId,
        int_Request_Id: reqId,
        int_Supplier_Id: quotation ? quotation.int_Supplier_Id : 1,
        int_Store_Id: requirement ? requirement.int_Store_Id : 1,
        dbl_Total_Amount: finalAmt,
        txt_PO_Code: poNum,
        txt_Status: 'PO Issued'
      })
    }).catch(() => null);

    saveDB(db);
    return newPO;
  },

  savePurchase: async (pData) => {
    if (pData.int_Quotation_Id) {
      return await mockApi.approveQuotationAndGeneratePO(pData.int_Quotation_Id);
    }
    await delay();
    const db = getDB();
    const existingPOs = db.tbl_Purchase || [];
    const newPOId = Math.max(...existingPOs.map(p => p.int_Purchase_Id || 0), 0) + 1;
    const poNum = pData.txt_PO_Code || generatePOCode(existingPOs);
    const newPO = {
      int_Purchase_Id: newPOId,
      txt_PO_Code: poNum,
      po_number: poNum,
      int_Quotation_Id: pData.int_Quotation_Id || null,
      int_Request_Id: pData.int_Request_Id || 1,
      int_Supplier_Id: pData.int_Supplier_Id || 1,
      int_Store_Id: pData.int_Store_Id || 1,
      dte_Purchase_Date: new Date().toISOString().split('T')[0],
      dte_PO_Date: new Date().toISOString().split('T')[0],
      dec_Final_Amount: pData.dbl_Total_Amount || 0,
      dbl_Total_Amount: pData.dbl_Total_Amount || 0,
      txt_Status: pData.txt_Status || 'PO Issued'
    };
    db.tbl_Purchase = db.tbl_Purchase || [];
    db.tbl_Purchase.push(newPO);
    saveDB(db);
    return newPO;
  },

  // PURCHASES / PO API (tbl_Purchase)
  getPurchases: async () => {
    const apiRes = await apiFetch('/purchases');
    const db = getDB();
    const localPurchases = db.tbl_Purchase || [];
    
    let combined = [];
    if (apiRes && Array.isArray(apiRes) && apiRes.length > 0) {
      combined = [...apiRes];
      localPurchases.forEach(lp => {
        const exists = combined.some(p => 
          (p.int_Purchase_Id && lp.int_Purchase_Id && Number(p.int_Purchase_Id) === Number(lp.int_Purchase_Id)) ||
          (p.txt_PO_Code && lp.txt_PO_Code && p.txt_PO_Code === lp.txt_PO_Code) ||
          (p.po_number && lp.po_number && p.po_number === lp.po_number)
        );
        if (!exists) combined.push(lp);
      });
    } else {
      combined = localPurchases;
    }

    const quotations = db.tbl_Quotation || [];
    const suppliers = db.tbl_Supplier || [];
    const stores = db.tbl_Store || [];
    const reqs = db.tbl_Inventory_Request || [];

    return combined.map(p => {
      const quotation = quotations.find(q => q.int_Quotation_Id === p.int_Quotation_Id);
      const supplier = quotation ? suppliers.find(s => s.int_Supplier_Id === quotation.int_Supplier_Id) : null;
      const store = stores.find(s => s.int_Store_Id === p.int_Store_Id);
      const req = quotation ? reqs.find(r => r.int_Request_Id === quotation.int_Request_Id) : null;

      return {
        ...p,
        po_number: p.po_number || p.txt_PO_Code || `PO-2026-${String(p.int_Purchase_Id || 1).padStart(3, '0')}`,
        supplier_name: supplier ? (supplier.txt_Supplier_Name || supplier.txt_Store_Name) : (p.supplier_name || p.txt_Supplier_Name || 'Global Supplies'),
        supplier_phone: supplier ? supplier.txt_Phone : (p.supplier_phone || p.txt_Phone || '+91 98765 01234'),
        store_name: store ? store.txt_Store_Name : (p.store_name || p.txt_Store_Name || 'Hostel Store'),
        dte_Purchase_Date: p.dte_Purchase_Date || (p.dte_PO_Date ? String(p.dte_PO_Date).split('T')[0] : '') || (p.dte_Created_Date ? String(p.dte_Created_Date).split('T')[0] : '2026-09-01'),
        dec_Final_Amount: p.dec_Final_Amount !== undefined && p.dec_Final_Amount !== null ? p.dec_Final_Amount : (p.dbl_Total_Amount || 0),
        request_no: req ? req.txt_Request_No : (p.request_no || (p.int_Request_Id ? `REQ-${String(p.int_Request_Id).padStart(3, '0')}` : 'REQ-0002')),
        quotation_amount: quotation ? quotation.dec_Total_Amount : (p.quotation_amount || p.dbl_Total_Amount || 0),
        transport_cost: quotation ? quotation.dec_Transport_Cost : (p.transport_cost || 0),
        delivery_days: quotation ? quotation.int_Delivery_Days : (p.delivery_days || 3)
      };
    });
  },

  updatePOStatus: async (purchaseId, status) => {
    const apiRes = await apiFetch(`/purchases/${purchaseId}/status`, { method: 'PATCH', body: JSON.stringify({ txt_Status: status }) });
    if (apiRes && apiRes.success) return apiRes;
    await delay();
    const db = getDB();
    const po = db.tbl_Purchase.find(p => p.int_Purchase_Id === purchaseId);
    if (po) {
      po.txt_Status = status;
      saveDB(db);
    }
    return po;
  },

  // STORE DELIVERY VERIFICATION & STOCK UPDATE (Core Requirement)
  receiveStoreDelivery: async (purchaseId, receivedItemsMap, remarks = '') => {
    await delay();
    const db = getDB();
    const po = db.tbl_Purchase.find(p => p.int_Purchase_Id === purchaseId);
    if (!po) throw new Error("Purchase Order not found");

    // Update PO Status to Delivered
    po.txt_Status = 'Delivered';
    po.txt_Remarks = remarks ? `${po.txt_Remarks} | Receipt Note: ${remarks}` : po.txt_Remarks;

    // Update Requirement status if found
    const quotation = db.tbl_Quotation.find(q => q.int_Quotation_Id === po.int_Quotation_Id);
    if (quotation) {
      const req = db.tbl_Inventory_Request.find(r => r.int_Request_Id === quotation.int_Request_Id);
      if (req) {
        req.txt_Status = 'Delivered';
      }
    }

    // Auto-update store-specific quantity_in_hand in tbl_Store_Stock
    const storeId = po.int_Store_Id || 1;
    db.tbl_Store_Stock = db.tbl_Store_Stock || {};
    if (!db.tbl_Store_Stock[storeId]) {
      db.tbl_Store_Stock[storeId] = {};
    }

    Object.keys(receivedItemsMap).forEach(productId => {
      const qtyAdded = Number(receivedItemsMap[productId] || 0);
      const itemId = Number(productId);
      const item = db.tbl_Item.find(i => i.int_Item_Id === itemId);
      const currentQty = (db.tbl_Store_Stock[storeId][itemId] !== undefined)
        ? Number(db.tbl_Store_Stock[storeId][itemId])
        : (item ? Number(item.int_quantity_in_hand || 0) : 0);

      db.tbl_Store_Stock[storeId][itemId] = currentQty + qtyAdded;
      if (item) {
        item.int_quantity_in_hand = Number(item.int_quantity_in_hand || 0) + qtyAdded;
      }
    });

    saveDB(db);

    apiFetch(`/purchases/${purchaseId}/status`, { method: 'PATCH', body: JSON.stringify({ txt_Status: 'Delivered' }) });

    return po;
  },

  // PAYMENTS API (tbl_Payment)
  getPayments: async () => {
    const apiRes = await apiFetch('/payments');
    const db = getDB();
    const localPayments = db.tbl_Payment || [];

    let combined = [];
    if (apiRes && Array.isArray(apiRes) && apiRes.length > 0) {
      combined = [...apiRes];
      localPayments.forEach(lp => {
        const exists = combined.some(p => Number(p.int_Payment_Id) === Number(lp.int_Payment_Id));
        if (!exists) combined.push(lp);
      });
    } else {
      combined = localPayments;
    }

    const purchases = db.tbl_Purchase || [];
    const quotations = db.tbl_Quotation || [];
    const suppliers = db.tbl_Supplier || [];

    return combined.map(pay => {
      const po = purchases.find(p => Number(p.int_Purchase_Id) === Number(pay.int_Purchase_Id));
      const quotation = po ? quotations.find(q => Number(q.int_Quotation_Id) === Number(po.int_Quotation_Id)) : null;
      const supplier = quotation 
        ? suppliers.find(s => Number(s.int_Supplier_Id) === Number(quotation.int_Supplier_Id))
        : (po ? suppliers.find(s => Number(s.int_Supplier_Id) === Number(po.int_Supplier_Id)) : null);

      return {
        ...pay,
        po_number: po ? (po.po_number || po.txt_PO_Code || `PO-2026-${String(po.int_Purchase_Id).padStart(3, '0')}`) : 'PO-2026-001',
        supplier_name: supplier ? (supplier.txt_Supplier_Name || supplier.txt_Store_Name) : (po?.supplier_name || pay.supplier_name || 'Global Supplies'),
        dec_Payment_Amount: pay.dec_Payment_Amount !== undefined && pay.dec_Payment_Amount !== null ? pay.dec_Payment_Amount : (pay.dbl_Amount || 5200),
        txt_Payment_No: pay.txt_Payment_No || pay.txt_Payment_Code || `PAY-2026-${String(pay.int_Payment_Id || 1).padStart(3, '0')}`,
        txt_Payment_Status: pay.txt_Payment_Status || 'Completed'
      };
    });
  },

  savePayment: async (paymentData) => {
    return await mockApi.recordPayment(paymentData);
  },

  recordPayment: async (paymentData) => {
    const payload = {
      int_Purchase_Id: Number(paymentData.int_Purchase_Id),
      dbl_Amount: Number(paymentData.dec_Payment_Amount || paymentData.dbl_Amount || 0),
      txt_Payment_Mode: paymentData.txt_Payment_Mode || 'NEFT Bank Transfer',
      txt_Transaction_Ref: paymentData.txt_Transaction_Id || paymentData.txt_Transaction_Ref || ''
    };
    apiFetch('/payments', { method: 'POST', body: JSON.stringify(payload) }).catch(() => null);

    await delay();
    const db = getDB();
    const newPayId = Math.max(...(db.tbl_Payment || []).map(p => p.int_Payment_Id || 0), 0) + 1;
    const payNo = paymentData.txt_Payment_No || generatePaymentCode(db.tbl_Payment || []);

    const newPayment = {
      int_Payment_Id: newPayId,
      int_Purchase_Id: Number(paymentData.int_Purchase_Id),
      txt_Payment_No: payNo,
      dte_Payment_Date: paymentData.dte_Payment_Date || new Date().toISOString().split('T')[0],
      dec_Payment_Amount: Number(paymentData.dec_Payment_Amount || paymentData.dbl_Amount || 0),
      txt_Payment_Mode: paymentData.txt_Payment_Mode || 'NEFT Bank Transfer',
      txt_Transaction_Id: paymentData.txt_Transaction_Id || `TXN${Date.now().toString().slice(-8)}`,
      txt_Payment_Status: 'Completed',
      txt_Remarks: paymentData.txt_Remarks || 'Payment recorded by Admin',
      dte_Created_Date: new Date().toISOString().split('T')[0],
      txt_Created_By: 'ADM001'
    };

    db.tbl_Payment = db.tbl_Payment || [];
    db.tbl_Payment.push(newPayment);

    if (db.tbl_Purchase) {
      const targetPO = db.tbl_Purchase.find(p => Number(p.int_Purchase_Id) === Number(paymentData.int_Purchase_Id));
      if (targetPO) {
        targetPO.txt_Status = 'Completed';
        targetPO.txt_Payment_Status = 'Completed';
      }
    }

    saveDB(db);
    return newPayment;
  },

  // REQUIREMENT PERIOD & DEADLINE API (tbl_Requirement_Period)
  getRequirementPeriod: async () => {
    const apiRes = await apiFetch('/requirements/period');
    if (apiRes && apiRes.txt_Status) return apiRes;
    await delay();
    const db = getDB();
    const allItemIds = (db.tbl_Item || []).map(i => i.int_Item_Id);
    if (!db.tbl_Requirement_Period) {
      db.tbl_Requirement_Period = {
        ...initialSeedData.tbl_Requirement_Period,
        arr_Active_Item_Ids: allItemIds.length > 0 ? allItemIds : [1]
      };
      saveDB(db);
    } else if (allItemIds.length > 0) {
      const validActive = (db.tbl_Requirement_Period.arr_Active_Item_Ids || []).filter(id => allItemIds.includes(id));
      db.tbl_Requirement_Period.arr_Active_Item_Ids = validActive.length > 0 ? validActive : allItemIds;
      saveDB(db);
    }
    return db.tbl_Requirement_Period;
  },

  saveRequirementPeriod: async (periodData) => {
    const apiRes = await apiFetch('/requirements/period', { method: 'POST', body: JSON.stringify(periodData) });
    if (apiRes && apiRes.txt_Status) return apiRes;
    await delay();
    const db = getDB();
    const existing = db.tbl_Requirement_Period || initialSeedData.tbl_Requirement_Period;
    db.tbl_Requirement_Period = {
      ...existing,
      ...periodData,
      dte_Updated_Date: new Date().toISOString()
    };
    saveDB(db);
    return db.tbl_Requirement_Period;
  },

  togglePeriodStatus: async (status) => {
    const apiRes = await apiFetch('/requirements/period', { method: 'POST', body: JSON.stringify({ txt_Status: status }) });
    if (apiRes && apiRes.txt_Status) return apiRes;
    await delay();
    const db = getDB();
    if (!db.tbl_Requirement_Period) {
      db.tbl_Requirement_Period = initialSeedData.tbl_Requirement_Period;
    }
    db.tbl_Requirement_Period.txt_Status = status;
    db.tbl_Requirement_Period.dte_Updated_Date = new Date().toISOString();
    saveDB(db);
    return db.tbl_Requirement_Period;
  }
};
