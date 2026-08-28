import { mockApi } from './mockApi';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper for making API HTTP requests
async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Backend API endpoint ${endpoint} unavailable, using fallback strategy.`);
    throw error;
  }
}

export const apiService = {
  // Auth Services
  async login(username, password, role) {
    return await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    });
  },

  async googleAdminLogin(email, name, picture) {
    return await fetchApi('/auth/google-admin', {
      method: 'POST',
      body: JSON.stringify({ email, name, picture })
    });
  },

  async getAdmins() {
    try {
      return await fetchApi('/auth/admins');
    } catch (e) {
      return [];
    }
  },

  // Stores
  async getStores() {
    try {
      return await fetchApi('/stores');
    } catch (e) {
      return await mockApi.getStores();
    }
  },

  async saveStore(storeData) {
    try {
      return await fetchApi('/stores', {
        method: 'POST',
        body: JSON.stringify(storeData)
      });
    } catch (e) {
      return await mockApi.saveStore(storeData);
    }
  },

  async deleteStore(id) {
    try {
      return await fetchApi(`/stores/${id}`, { method: 'DELETE' });
    } catch (e) {
      return await mockApi.deleteStore(id);
    }
  },

  // Suppliers
  async getSuppliers() {
    try {
      return await fetchApi('/suppliers');
    } catch (e) {
      return await mockApi.getSuppliers();
    }
  },

  async saveSupplier(supplierData) {
    try {
      return await fetchApi('/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData)
      });
    } catch (e) {
      return await mockApi.saveSupplier(supplierData);
    }
  },

  async deleteSupplier(id) {
    try {
      return await fetchApi(`/suppliers/${id}`, { method: 'DELETE' });
    } catch (e) {
      return await mockApi.deleteSupplier(id);
    }
  },

  // Categories
  async getCategories() {
    try {
      return await fetchApi('/categories');
    } catch (e) {
      return await mockApi.getCategories();
    }
  },

  async saveCategory(catData) {
    try {
      const res = await fetchApi('/categories', {
        method: 'POST',
        body: JSON.stringify(catData)
      });
      try { await mockApi.saveCategory(catData); } catch (e) {}
      return res || await mockApi.saveCategory(catData);
    } catch (e) {
      return await mockApi.saveCategory(catData);
    }
  },

  async deleteCategory(id) {
    try {
      const res = await fetchApi(`/categories/${id}`, { method: 'DELETE' });
      try { await mockApi.deleteCategory(id); } catch (e) {}
      return res || await mockApi.deleteCategory(id);
    } catch (e) {
      return await mockApi.deleteCategory(id);
    }
  },

  // Items
  async getItems() {
    try {
      const res = await fetchApi('/items');
      if (res && Array.isArray(res)) {
        return res.map(item => ({
          ...item,
          dec_Last_Purchase_Price: Number(item.dec_Last_Purchase_Price !== undefined ? item.dec_Last_Purchase_Price : (item.dbl_Unit_Price || 0)),
          int_quantity_in_hand: Number(item.int_quantity_in_hand !== undefined ? item.int_quantity_in_hand : (item.int_Current_Stock || 0))
        }));
      }
      return await mockApi.getItems();
    } catch (e) {
      return await mockApi.getItems();
    }
  },

  async saveItem(itemData) {
    try {
      const res = await fetchApi('/items', {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
      const mockResult = await mockApi.saveItem(itemData);
      if (res && Array.isArray(res)) {
        return res.map(item => ({
          ...item,
          dec_Last_Purchase_Price: Number(item.dec_Last_Purchase_Price !== undefined ? item.dec_Last_Purchase_Price : (item.dbl_Unit_Price || 0)),
          int_quantity_in_hand: Number(item.int_quantity_in_hand !== undefined ? item.int_quantity_in_hand : (item.int_Current_Stock || 0))
        }));
      }
      return mockResult;
    } catch (e) {
      return await mockApi.saveItem(itemData);
    }
  },

  async deleteItem(id) {
    try {
      const res = await fetchApi(`/items/${id}`, { method: 'DELETE' });
      try { await mockApi.deleteItem(id); } catch (e) {}
      return res || await mockApi.deleteItem(id);
    } catch (e) {
      return await mockApi.deleteItem(id);
    }
  },

  // Requirements
  async getRequests() {
    try {
      return await fetchApi('/requirements');
    } catch (e) {
      return await mockApi.getRequests();
    }
  },

  async saveRequest(reqData, reqItems = []) {
    const payload = {
      ...reqData,
      items: reqItems.length > 0 ? reqItems : (reqData.items || [])
    };
    try {
      const res = await fetchApi('/requirements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      try {
        await mockApi.createRequirement(reqData, payload.items);
      } catch (e) {}
      return res;
    } catch (e) {
      return await mockApi.createRequirement(reqData, payload.items);
    }
  },

  async updateRequestStatus(id, status, remarks) {
    try {
      return await fetchApi(`/requirements/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ txt_Status: status, status, txt_Remarks: remarks, remarks })
      });
    } catch (e) {
      return await mockApi.updateRequestStatus(id, status, remarks);
    }
  },

  // Quotations
  async getQuotations() {
    try {
      const res = await fetchApi('/quotations');
      const mockResult = await mockApi.getQuotations();
      if (res && Array.isArray(res) && res.length > 0) {
        return res.map(q => ({
          ...q,
          dec_Total_Amount: Number(q.dec_Total_Amount !== undefined ? q.dec_Total_Amount : (q.dbl_Total_Amount || 0)),
          dbl_Total_Amount: Number(q.dbl_Total_Amount !== undefined ? q.dbl_Total_Amount : (q.dec_Total_Amount || 0)),
          dec_Transport_Cost: Number(q.dec_Transport_Cost !== undefined ? q.dec_Transport_Cost : (q.dbl_Transport_Cost || 500)),
          supplier_name: q.supplier_name || q.txt_Supplier_Name || 'Apex Traders'
        }));
      }
      return mockResult;
    } catch (e) {
      return await mockApi.getQuotations();
    }
  },

  async saveQuotation(qData) {
    try {
      const res = await fetchApi('/quotations', {
        method: 'POST',
        body: JSON.stringify(qData)
      });
      await mockApi.saveQuotation(qData);
      return res || await mockApi.getQuotations();
    } catch (e) {
      return await mockApi.saveQuotation(qData);
    }
  },

  // Purchases
  async getPurchases() {
    try {
      return await fetchApi('/purchases');
    } catch (e) {
      return await mockApi.getPurchases();
    }
  },

  async savePurchase(pData) {
    try {
      return await fetchApi('/purchases', {
        method: 'POST',
        body: JSON.stringify(pData)
      });
    } catch (e) {
      return await mockApi.savePurchase(pData);
    }
  },

  // Payments
  async getPayments() {
    try {
      return await fetchApi('/payments');
    } catch (e) {
      return await mockApi.getPayments();
    }
  },

  async savePayment(payData) {
    try {
      return await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify(payData)
      });
    } catch (e) {
      return await mockApi.savePayment(payData);
    }
  }
};
