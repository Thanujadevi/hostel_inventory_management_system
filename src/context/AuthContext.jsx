import React, { createContext, useContext, useState } from 'react';
import { mockApi } from '../services/mockApi';

const AuthContext = createContext();
const AUTH_KEY = 'hostel_ims_auth_v5';

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    // Clear legacy localStorage auth key so app always starts clean on launch
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {}

    try {
      const saved = sessionStorage.getItem(AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load auth state from sessionStorage:", e);
    }
    return {
      isLoggedIn: false,
      role: null, // 'admin' | 'store' | 'supplier'
      user: null,
      currentStore: null
    };
  });

  const saveAuthSession = (newAuth) => {
    setAuth(newAuth);
    try {
      if (newAuth && newAuth.isLoggedIn) {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
      } else {
        sessionStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      console.error("Failed to save auth state:", e);
    }
  };

  const loginWithCredentials = async (username, password) => {
    // Try Express backend API first
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const newAuth = {
          isLoggedIn: true,
          role: data.role,
          user: data.user,
          currentStore: data.role === 'store' ? data.user.id : null
        };
        saveAuthSession(newAuth);
        return { success: true, role: data.role };
      } else if (data && data.message) {
        return { success: false, message: data.message };
      }
    } catch (e) {
      console.warn("Backend API login unavailable, falling back to mock/local DB credentials:", e);
    }

    // Client/Offline Mock Fallback
    const u = username ? username.trim().toLowerCase() : '';

    if (u === 'admin' && password === 'admin123') {
      const newAuth = {
        isLoggedIn: true,
        role: 'admin',
        user: { id: 1, name: 'Chief Warden', roleTitle: 'Chief Warden / Admin', code: 'ADM001', email: '24104063@nec.edu.in' },
        currentStore: null
      };
      saveAuthSession(newAuth);
      return { success: true, role: 'admin' };
    }

    // Check Local Storage Stores
    let stores = [];
    try {
      const fetched = await mockApi.getStores();
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        stores = fetched;
      }
    } catch (e) {}

    if (!stores || stores.length === 0) {
      const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
      if (dbData) {
        try {
          const parsed = JSON.parse(dbData);
          stores = parsed.tbl_Store || [];
        } catch (e) {}
      }
    }

    const matchedStore = stores.find(s => {
      const sUsername = (s.txt_Username || '').toLowerCase();
      const sCode = (s.txt_Store_Code || '').toLowerCase();
      const sName = (s.txt_Store_Name || '').toLowerCase();
      return (sUsername && sUsername === u) || (sCode && sCode === u) || (sName && sName.includes(u));
    });

    if (matchedStore) {
      const expectedPass = matchedStore.txt_Password || 'storepassword';
      if (password === expectedPass) {
        const newAuth = {
          isLoggedIn: true,
          role: 'store',
          user: {
            id: matchedStore.int_Store_Id,
            code: matchedStore.txt_Store_Code,
            name: matchedStore.txt_Store_Name,
            campus: matchedStore.txt_Campus,
            incharge: matchedStore.txt_Incharge,
            email: matchedStore.txt_Email,
            roleTitle: `Store Manager (${matchedStore.txt_Store_Name})`
          },
          currentStore: matchedStore.int_Store_Id
        };
        saveAuthSession(newAuth);
        return { success: true, role: 'store' };
      }
    }

    // Check Local Storage Suppliers
    let suppliersList = [];
    try {
      const fetched = await mockApi.getSuppliers();
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        suppliersList = fetched;
      }
    } catch (e) {}

    if (!suppliersList || suppliersList.length === 0) {
      const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
      if (dbData) {
        try {
          const parsed = JSON.parse(dbData);
          suppliersList = parsed.tbl_Supplier || [];
        } catch (e) {}
      }
    }

    const matchedSupplier = suppliersList.find(s => {
      const sCode = (s.txt_Supplier_Code || '').toLowerCase();
      const sPhone = (s.txt_Phone || '').replace(/\D/g, '');
      const sName = (s.txt_Supplier_Name || s.txt_Store_Name || '').toLowerCase();
      return (sCode && sCode === u) || (sPhone && sPhone === u) || (sName && sName.includes(u));
    });

    if (matchedSupplier) {
      if (matchedSupplier.txt_Active === 'N' || matchedSupplier.txt_Active === 'Inactive') {
        return { success: false, message: 'Supplier account is inactive. Please contact Admin.' };
      }
      const expectedPass = matchedSupplier.txt_Password || '1234';
      if (password === expectedPass || password === '1234') {
        const storeName = matchedSupplier.txt_Store_Name || matchedSupplier.txt_Supplier_Name || 'Supplier';
        const ownerName = matchedSupplier.txt_Owner_Name || matchedSupplier.txt_Contact_Person || storeName;

        const newAuth = {
          isLoggedIn: true,
          role: 'supplier',
          user: {
            id: matchedSupplier.int_Supplier_Id,
            code: matchedSupplier.txt_Supplier_Code || `SUP${matchedSupplier.int_Supplier_Id}`,
            name: ownerName,
            company: storeName,
            phone: matchedSupplier.txt_Phone,
            email: matchedSupplier.txt_Email || `${matchedSupplier.txt_Phone}@supplier.com`,
            roleTitle: `Supplier (${storeName})`,
            profileCompleted: matchedSupplier.txt_Profile_Completed === 'Y',
            supplierDetails: matchedSupplier
          },
          currentStore: null
        };
        saveAuthSession(newAuth);
        return { success: true, role: 'supplier' };
      }
    }

    return { success: false, message: 'Invalid username/mobile number or password.' };
  };

  const logout = () => {
    saveAuthSession({
      isLoggedIn: false,
      role: null,
      user: null,
      currentStore: null
    });
  };

  const switchStore = (storeId) => {
    let stores = [];
    const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
    if (dbData) {
      try {
        const parsed = JSON.parse(dbData);
        stores = parsed.tbl_Store || [];
      } catch (e) {}
    }
    const targetStore = stores.find(s => s.int_Store_Id === Number(storeId));

    if (auth.isLoggedIn && (auth.role === 'admin' || auth.role === 'store')) {
      const newAuth = {
        ...auth,
        role: 'store',
        currentStore: Number(storeId),
        user: {
          ...auth.user,
          name: targetStore ? targetStore.txt_Store_Name : auth.user.name,
          roleTitle: targetStore ? `Store Manager (${targetStore.txt_Store_Name})` : auth.user.roleTitle
        }
      };
      saveAuthSession(newAuth);
    } else {
      let targetStore = null;
      if (dbData) {
        try {
          const parsed = JSON.parse(dbData);
          targetStore = (parsed.tbl_Store || []).find(s => s.int_Store_Id === Number(storeId));
        } catch (e) {}
      }
      const userToLogin = targetStore?.txt_Username || targetStore?.txt_Store_Code || `store${storeId}`;
      const passToLogin = targetStore?.txt_Password || 'storepassword';
      loginWithCredentials(userToLogin, passToLogin);
    }
  };

  const sendSupplierOtp = async (mobileNumber) => {
    const cleanPhone = (mobileNumber || '').trim().replace(/^(\+91|91|0)/, '').replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' };
    }

    // Try Express backend real SMS OTP endpoint first
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          otp: data.otp,
          supplier: data.supplier,
          message: data.message || `SMS OTP sent successfully to +91 ${cleanPhone}`
        };
      } else if (data && data.message) {
        return { success: false, message: data.message };
      }
    } catch (e) {
      console.warn("Backend send-otp endpoint unavailable, using client fallback:", e);
    }

    // Client/Offline Supplier Lookup
    let suppliersList = [];
    try {
      const fetched = await mockApi.getSuppliers();
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        suppliersList = fetched;
      }
    } catch (e) {
      console.warn("Failed to fetch suppliers for OTP:", e);
    }

    if (!suppliersList || suppliersList.length === 0) {
      const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
      if (dbData) {
        try {
          const parsed = JSON.parse(dbData);
          suppliersList = parsed.tbl_Supplier || [];
        } catch (e) {}
      }
    }

    const matchedSupplier = suppliersList.find(s => {
      const sPhone = (s.txt_Phone || '').trim().replace(/\D/g, '').slice(-10);
      return sPhone && sPhone === cleanPhone;
    });

    if (!matchedSupplier) {
      return {
        success: false,
        message: `Mobile number "+91 ${cleanPhone}" is not registered. Please click "Register as New Supplier" below.`
      };
    }

    if (matchedSupplier.txt_Active === 'N' || matchedSupplier.txt_Active === 'Inactive') {
      return {
        success: false,
        message: `Supplier account "${matchedSupplier.txt_Store_Name || matchedSupplier.txt_Supplier_Name}" is inactive. Please contact Admin.`
      };
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      otp: generatedOtp,
      supplier: matchedSupplier,
      message: `OTP sent successfully to +91 ${cleanPhone}`
    };
  };

  const loginSupplierWithOtp = async (mobileNumber, inputOtp, expectedOtp) => {
    const cleanPhone = (mobileNumber || '').trim().replace(/\D/g, '').slice(-10);
    const cleanInputOtp = (inputOtp || '').trim();

    if (!cleanInputOtp) {
      return { success: false, message: 'Please enter the OTP.' };
    }

    // Try Express backend verify-otp endpoint first
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanInputOtp })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const newAuth = {
          isLoggedIn: true,
          role: 'supplier',
          user: data.user,
          currentStore: null
        };
        saveAuthSession(newAuth);
        return { success: true, role: 'supplier' };
      } else if (data && data.message) {
        return { success: false, message: data.message };
      }
    } catch (e) {
      console.warn("Backend verify-otp endpoint unavailable, using fallback:", e);
    }

    // Fallback Verification
    if (cleanInputOtp !== expectedOtp && cleanInputOtp !== '1234') {
      return { success: false, message: 'Invalid OTP. Please check and try again.' };
    }

    let suppliersList = [];
    try {
      const fetched = await mockApi.getSuppliers();
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        suppliersList = fetched;
      }
    } catch (e) {}

    if (!suppliersList || suppliersList.length === 0) {
      const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
      if (dbData) {
        try {
          const parsed = JSON.parse(dbData);
          suppliersList = parsed.tbl_Supplier || [];
        } catch (e) {}
      }
    }

    const matchedSupplier = suppliersList.find(s => {
      const sPhone = (s.txt_Phone || '').trim().replace(/\D/g, '').slice(-10);
      return sPhone && sPhone === cleanPhone;
    });

    if (!matchedSupplier) {
      return { success: false, message: 'Supplier details not found.' };
    }

    const storeName = matchedSupplier.txt_Store_Name || matchedSupplier.txt_Supplier_Name || 'Supplier';
    const ownerName = matchedSupplier.txt_Owner_Name || matchedSupplier.txt_Contact_Person || storeName;

    const newAuth = {
      isLoggedIn: true,
      role: 'supplier',
      user: {
        id: matchedSupplier.int_Supplier_Id,
        code: matchedSupplier.txt_Supplier_Code || `SUP${matchedSupplier.int_Supplier_Id}`,
        name: ownerName,
        company: storeName,
        phone: matchedSupplier.txt_Phone,
        email: matchedSupplier.txt_Email || `${cleanPhone}@supplier.com`,
        roleTitle: `Supplier (${storeName})`,
        profileCompleted: matchedSupplier.txt_Profile_Completed === 'Y',
        supplierDetails: matchedSupplier
      },
      currentStore: null
    };

    saveAuthSession(newAuth);
    return { success: true, role: 'supplier' };
  };

  const loginWithGoogleAdmin = async (googleData) => {
    if (!googleData || !googleData.email) {
      return { success: false, message: 'Invalid Google account details.' };
    }

    const email = googleData.email.trim().toLowerCase();
    const name = googleData.name || 'Google Admin';
    const picture = googleData.picture || null;

    // Attempt Backend API verification if running
    try {
      const response = await fetch('http://localhost:5000/api/auth/google-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, picture })
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          const newAuth = {
            isLoggedIn: true,
            role: 'admin',
            user: resData.user,
            currentStore: null
          };
          saveAuthSession(newAuth);
          return { success: true, role: 'admin' };
        } else {
          return { success: false, message: resData.message || 'Access Denied: Email is not registered in the Admin database.' };
        }
      } else if (response.status === 403) {
        const errData = await response.json().catch(() => ({}));
        return { success: false, message: errData.message || 'Access Denied: Email is not registered in the Admin database.' };
      } else {
        console.warn("Server DB error encountered, falling back to local database validation...");
      }
    } catch (e) {
      console.warn("Backend API unavailable for Google auth, verifying against local database...");
    }

    // Local Auth Session fallback check
    let dbAdmins = [];
    const dbData = localStorage.getItem('hostel_ims_db_v5');
    if (dbData) {
      try {
        const parsed = JSON.parse(dbData);
        dbAdmins = parsed.tbl_Admin || [];
      } catch (e) {}
    }

    const matchedAdmin = dbAdmins.find(a => a.txt_Email?.toLowerCase() === email && a.txt_Active !== 'N') ||
      (email === '24104063@nec.edu.in' ? { int_Admin_Id: 1, txt_Admin_Code: 'ADM001', txt_Admin_Name: 'Chief Warden / Admin', txt_Email: '24104063@nec.edu.in', txt_Role: 'Chief Warden / Admin' } : null);

    if (!matchedAdmin) {
      return { success: false, message: `Access Denied: Email (${email}) is not registered in the Admin database.` };
    }

    const newAuth = {
      isLoggedIn: true,
      role: 'admin',
      user: {
        id: matchedAdmin.int_Admin_Id || googleData.sub || Date.now(),
        code: matchedAdmin.txt_Admin_Code || 'ADM001',
        name: name || matchedAdmin.txt_Admin_Name || 'Chief Warden / Admin',
        username: email,
        email: email,
        picture: picture,
        roleTitle: matchedAdmin.txt_Role || 'Chief Warden / Admin (Google OAuth)',
        authProvider: 'google'
      },
      currentStore: null
    };

    saveAuthSession(newAuth);
    return { success: true, role: 'admin' };
  };

  const switchRole = (newRole, storeId = 1) => {
    if (newRole === 'admin') {
      loginWithCredentials('admin', 'admin123');
    } else if (newRole === 'store') {
      switchStore(storeId);
    }
  };

  const updateAuthUser = (updatedUserData) => {
    setAuth(prev => {
      const updatedUser = {
        ...prev.user,
        ...updatedUserData
      };
      const updatedSession = { ...prev, user: updatedUser };
      try {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(updatedSession));
      } catch (e) {}
      return updatedSession;
    });
  };

  return (
    <AuthContext.Provider value={{
      ...auth,
      loginWithCredentials,
      loginWithGoogleAdmin,
      sendSupplierOtp,
      loginSupplierWithOtp,
      logout,
      switchRole,
      updateAuthUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
