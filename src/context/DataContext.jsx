import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockApi } from '../services/mockApi';
import { apiService } from '../services/api';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [requirementPeriod, setRequirementPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ id: Date.now(), message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, supData, cData, iData, rData, qData, pData, payData, admData, reqPeriod] = await Promise.all([
        apiService.getStores(),
        apiService.getSuppliers(),
        apiService.getCategories(),
        apiService.getItems(),
        apiService.getRequests(),
        apiService.getQuotations(),
        apiService.getPurchases(),
        apiService.getPayments(),
        apiService.getAdmins(),
        apiService.getRequirementPeriod()
      ]);
      setStores(sData || []);
      setSuppliers(supData || []);
      setCategories(cData || []);
      setItems(iData || []);
      setRequests(rData || []);
      setQuotations(qData || []);
      setPurchases(pData || []);
      setPayments(payData || []);
      setAdmins(admData || []);
      setRequirementPeriod(reqPeriod);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
      showToast("Error loading inventory records", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem('hostel_ims_db_v8');
      localStorage.removeItem('hostel_ims_db_v7');
      localStorage.removeItem('hostel_ims_db_v6');
      localStorage.removeItem('hostel_ims_db_v5');
      localStorage.removeItem('hostel_ims_db_v4');
      localStorage.removeItem('hostel_ims_db_v3');
    } catch (e) {}
    refreshAll();
  }, [refreshAll]);

  const saveRequirementPeriod = async (periodData) => {
    try {
      const updated = await apiService.saveRequirementPeriod(periodData);
      setRequirementPeriod(updated);
      showToast("Requirement Period settings updated successfully!", "success");
      return updated;
    } catch (err) {
      showToast("Failed to save Requirement Period settings", "error");
    }
  };

  const togglePeriodStatus = async (status) => {
    try {
      const updated = await apiService.toggleRequirementPeriod(status);
      setRequirementPeriod(updated);
      showToast(`Requirement raising period is now ${status === 'OPEN' ? 'OPEN' : 'CLOSED'}`, status === 'OPEN' ? 'success' : 'info');
      return updated;
    } catch (err) {
      showToast("Failed to change requirement period status", "error");
    }
  };

  const isRequirementWindowActive = (period = requirementPeriod) => {
    if (!period || period.txt_Status !== 'OPEN') return false;
    if (period.dte_Deadline) {
      const deadline = new Date(period.dte_Deadline).getTime();
      const now = Date.now();
      if (now > deadline) return false;
    }
    return true;
  };

  const getStoreItems = useCallback((storeId) => {
    if (!storeId) return items;
    const dbData = localStorage.getItem('hostel_ims_db_v4');
    let storeStockMap = {};
    if (dbData) {
      try {
        const parsed = JSON.parse(dbData);
        storeStockMap = (parsed.tbl_Store_Stock && parsed.tbl_Store_Stock[storeId]) || {};
      } catch (e) {}
    }
    return items.map(item => ({
      ...item,
      int_quantity_in_hand: storeStockMap[item.int_Item_Id] !== undefined
        ? Number(storeStockMap[item.int_Item_Id])
        : Number(item.int_quantity_in_hand || item.int_Current_Stock || 0)
    }));
  }, [items]);

  // Action Helpers
  const resetDatabase = async () => {
    await mockApi.resetToSeed();
    await refreshAll();
    showToast("Database reset to factory seed data", "success");
  };

  return (
    <DataContext.Provider value={{
      stores,
      suppliers,
      categories,
      items,
      getStoreItems,
      requests,
      quotations,
      purchases,
      payments,
      admins,
      requirementPeriod,
      saveRequirementPeriod,
      togglePeriodStatus,
      isRequirementWindowActive,
      loading,
      toastMessage,
      showToast,
      refreshAll,
      resetDatabase,
      apiService,
      mockApi
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
