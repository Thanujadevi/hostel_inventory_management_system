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
      return await fetchApi('/categories', {
        method: 'POST',
        body: JSON.stringify(catData)
      });
    } catch (e) {
      return await mockApi.saveCategory(catData);
    }
  },

  async deleteCategory(id) {
    try {
      return await fetchApi(`/categories/${id}`, { method: 'DELETE' });
    } catch (e) {
      return await mockApi.deleteCategory(id);
    }
  },

  // Items
  async getItems() {
    try {
      return await fetchApi('/items');
    } catch (e) {
      return await mockApi.getItems();
    }
  },

  async saveItem(itemData) {
    try {
      return await fetchApi('/items', {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
    } catch (e) {
      return await mockApi.saveItem(itemData);
    }
  },

  async deleteItem(id) {
    try {
      return await fetchApi(`/items/${id}`, { method: 'DELETE' });
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
        method: 'PUT',
        body: JSON.stringify({ status, remarks })
      });
    } catch (e) {
      return await mockApi.updateRequestStatus(id, status, remarks);
    }
  },

  // Quotations
  async getQuotations() {
    try {
      return await fetchApi('/quotations');
    } catch (e) {
      return await mockApi.getQuotations();
    }
  },

  async saveQuotation(qData) {
    try {
      return await fetchApi('/quotations', {
        method: 'POST',
        body: JSON.stringify(qData)
      });
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
