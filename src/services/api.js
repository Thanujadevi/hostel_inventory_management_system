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
    const res = await fetchApi('/stores').catch(() => null);
    if (res && Array.isArray(res)) return res;
    return await mockApi.getStores();
  },

  async saveStore(storeData) {
    const res = await fetchApi('/stores', {
      method: 'POST',
      body: JSON.stringify(storeData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.saveStore(storeData);
  },

  async deleteStore(id) {
    const res = await fetchApi(`/stores/${id}`, { method: 'DELETE' }).catch(() => null);
    if (res) return res;
    return await mockApi.deleteStore(id);
  },

  // Suppliers
  async getSuppliers() {
    const res = await fetchApi('/suppliers').catch(() => null);
    if (res && Array.isArray(res)) return res;
    return await mockApi.getSuppliers();
  },

  async saveSupplier(supplierData) {
    const res = await fetchApi('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.saveSupplier(supplierData);
  },

  async deleteSupplier(id) {
    const res = await fetchApi(`/suppliers/${id}`, { method: 'DELETE' }).catch(() => null);
    if (res) return res;
    return await mockApi.deleteSupplier(id);
  },

  // Categories
  async getCategories() {
    const res = await fetchApi('/categories').catch(() => null);
    if (res && Array.isArray(res)) return res;
    return await mockApi.getCategories();
  },

  async saveCategory(catData) {
    const res = await fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify(catData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.saveCategory(catData);
  },

  async deleteCategory(id) {
    const res = await fetchApi(`/categories/${id}`, { method: 'DELETE' }).catch(() => null);
    if (res) return res;
    return await mockApi.deleteCategory(id);
  },

  // Items
  async getItems() {
    return await mockApi.getItems();
  },

  async saveItem(itemData) {
    const res = await fetchApi('/items', {
      method: 'POST',
      body: JSON.stringify(itemData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.saveItem(itemData);
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
    return await mockApi.getRequests();
  },

  async saveRequest(reqData, reqItems = []) {
    const payload = {
      ...reqData,
      items: reqItems.length > 0 ? reqItems : (reqData.items || [])
    };
    const res = await fetchApi('/requirements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => null);
    let mockRes = null;
    try {
      mockRes = await mockApi.createRequirement(reqData, payload.items);
    } catch (e) {}
    if (res) return { ...mockRes, ...res };
    return mockRes;
  },

  async updateRequestStatus(id, status, remarks) {
    const res = await fetchApi(`/requirements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ txt_Status: status, status, remarks, txt_Remarks: remarks })
    }).catch(() => null);
    try {
      await mockApi.updateRequestStatus(id, status, remarks);
    } catch (e) {}
    if (res) return res;
    return await mockApi.updateRequestStatus(id, status, remarks);
  },

  async deleteRequest(id) {
    const res = await fetchApi(`/requirements/${id}`, { method: 'DELETE' }).catch(() => null);
    try {
      await mockApi.deleteRequirement(id);
    } catch (e) {}
    if (res) return res;
    return await mockApi.deleteRequirement(id);
  },

  // Quotations
  async getQuotations() {
    return await mockApi.getQuotations();
  },

  async saveQuotation(qData) {
    const res = await fetchApi('/quotations', {
      method: 'POST',
      body: JSON.stringify(qData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.saveQuotation(qData);
  },

  // Purchases
  async getPurchases() {
    return await mockApi.getPurchases();
  },

  async savePurchase(pData) {
    const res = await fetchApi('/purchases', {
      method: 'POST',
      body: JSON.stringify(pData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.savePurchase(pData);
  },

  // Payments
  async getPayments() {
    return await mockApi.getPayments();
  },

  async savePayment(payData) {
    const res = await fetchApi('/payments', {
      method: 'POST',
      body: JSON.stringify(payData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.savePayment(payData);
  },

  // Requirement Period
  async getRequirementPeriod() {
    let res = await fetchApi('/requirements/period').catch(() => null);
    if (!res) res = await fetchApi('/requirement-period').catch(() => null);
    if (res) return res;
    return await mockApi.getRequirementPeriod();
  },

  async saveRequirementPeriod(periodData) {
    const res = await fetchApi('/requirement-period', {
      method: 'POST',
      body: JSON.stringify(periodData)
    }).catch(() => null);
    if (res) return res;
    return await mockApi.saveRequirementPeriod(periodData);
  },

  async toggleRequirementPeriod(status) {
    try {
      return await fetchApi('/requirement-period/toggle', {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (e) {
      return await mockApi.togglePeriodStatus(status);
    }
  }
};
