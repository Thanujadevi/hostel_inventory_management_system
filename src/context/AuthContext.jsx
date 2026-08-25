import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();
const AUTH_KEY = 'hostel_ims_auth_v5';

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load auth state from localStorage:", e);
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
        localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      console.error("Failed to save auth state:", e);
    }
  };

  const loginWithCredentials = async (username, password) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    // Attempt Express MySQL Backend Auth
    try {
      const isAdminUser = cleanUsername === 'admin' || cleanUsername === '24104063@nec.edu.in';
      const roleTry = isAdminUser ? 'admin' : 'store';
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword, role: roleTry })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newAuth = {
            isLoggedIn: true,
            role: data.role,
            user: data.user,
            currentStore: data.role === 'store' ? data.user : null
          };
          saveAuthSession(newAuth);
          return { success: true, role: data.role };
        }
      }
    } catch (e) {
      console.warn("Backend auth unavailable, trying client fallback...");
    }

    // Admin Login Check
    if (cleanUsername === 'admin' || cleanUsername === '24104063@nec.edu.in') {
      if (cleanPassword !== 'admin' && cleanPassword !== 'admin123' && cleanPassword !== 'password') {
        return { success: false, message: 'Invalid admin password.' };
      }
      const newAuth = {
        isLoggedIn: true,
        role: 'admin',
        user: {
          id: 1,
          code: 'ADM001',
          name: 'Chief Warden / Admin',
          username: cleanUsername,
          email: '24104063@nec.edu.in',
          roleTitle: 'Chief Warden / Admin'
        },
        currentStore: null
      };
      saveAuthSession(newAuth);
      return { success: true, role: 'admin' };
    }

    // Dynamic Store Login Check
    let storesList = [];
    const dbData = localStorage.getItem('hostel_ims_db_v5');
    if (dbData) {
      try {
        const parsed = JSON.parse(dbData);
        storesList = parsed.tbl_Store || [];
      } catch (e) {
        console.error("Error parsing DB for store login:", e);
      }
    }

    // Find store by username, store code, or email
    let matchedStore = storesList.find(s =>
      (s.txt_Username && s.txt_Username.trim().toLowerCase() === cleanUsername) ||
      (s.txt_Store_Code && s.txt_Store_Code.trim().toLowerCase() === cleanUsername) ||
      (s.txt_Email && s.txt_Email.trim().toLowerCase() === cleanUsername)
    );

    // Fallback search for quick logins like "store1", "store2", "str001"
    if (!matchedStore && (cleanUsername.startsWith('store') || cleanUsername.startsWith('str'))) {
      const numMatch = cleanUsername.replace(/\D/g, '');
      if (numMatch) {
        const storeIdNum = parseInt(numMatch, 10);
        matchedStore = storesList.find(s => s.int_Store_Id === storeIdNum);
      }
    }

    if (matchedStore) {
      // 1. Check Active Status
      if (matchedStore.txt_Active === 'N' || matchedStore.txt_Active === 'Inactive') {
        return {
          success: false,
          message: `Store account "${matchedStore.txt_Store_Name}" is currently INACTIVE. Please contact System Administrator.`
        };
      }

      // 2. Verify Password
      const expectedPassword = matchedStore.txt_Password || 'storepassword';
      if (cleanPassword !== expectedPassword) {
        return {
          success: false,
          message: 'Invalid password. Please check your password and try again.'
        };
      }

      // 3. Authenticate Store User
      const newAuth = {
        isLoggedIn: true,
        role: 'store',
        user: {
          id: matchedStore.int_Store_Id,
          code: matchedStore.txt_Store_Code,
          name: matchedStore.txt_Incharge_Name || matchedStore.txt_Store_Name,
          email: matchedStore.txt_Email,
          username: matchedStore.txt_Username || matchedStore.txt_Store_Code.toLowerCase(),
          roleTitle: `Store In-Charge (${matchedStore.txt_Store_Name})`
        },
        currentStore: {
          id: matchedStore.int_Store_Id,
          code: matchedStore.txt_Store_Code,
          name: matchedStore.txt_Store_Name,
          type: matchedStore.txt_Store_Type,
          location: matchedStore.txt_Location,
          incharge: matchedStore.txt_Incharge_Name,
          email: matchedStore.txt_Email,
          phone: matchedStore.txt_Phone
        }
      };
      saveAuthSession(newAuth);
      return { success: true, role: 'store' };
    }

    // Supplier Login Check
    if (cleanUsername.includes('supplier') || cleanUsername.startsWith('sup')) {
      const newAuth = {
        isLoggedIn: true,
        role: 'supplier',
        user: {
          id: 1,
          code: 'SUP001',
          name: 'Registered Supplier',
          company: 'Supplier Account',
          email: `${cleanUsername}@supplier.com`,
          roleTitle: 'Supplier Portal',
          profileCompleted: false
        },
        currentStore: null
      };
      saveAuthSession(newAuth);
      return { success: true, role: 'supplier' };
    }

    return { success: false, message: 'Invalid username or password. Please try again.' };
  };

  const logout = () => {
    saveAuthSession({
      isLoggedIn: false,
      role: null,
      user: null,
      currentStore: null
    });
  };

  const switchRole = (newRole, storeId = 1) => {
    if (newRole === 'admin') {
      loginWithCredentials('admin', 'admin');
    } else if (newRole === 'store') {
      const dbData = localStorage.getItem('hostel_ims_db_v5');
      let targetStore = null;
      if (dbData) {
        try {
          const parsed = JSON.parse(dbData);
          targetStore = (parsed.tbl_Store || []).find(s => s.int_Store_Id === storeId);
        } catch (e) {}
      }
      const userToLogin = targetStore?.txt_Username || targetStore?.txt_Store_Code || `store${storeId}`;
      const passToLogin = targetStore?.txt_Password || 'storepassword';
      loginWithCredentials(userToLogin, passToLogin);
    }
  };

  const sendSupplierOtp = (mobileNumber) => {
    const cleanPhone = (mobileNumber || '').trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      return { success: false, message: 'Please enter a valid mobile number.' };
    }

    let suppliersList = [];
    const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
    if (dbData) {
      try {
        const parsed = JSON.parse(dbData);
        suppliersList = parsed.tbl_Supplier || [];
      } catch (e) {
        console.error("Error parsing DB for supplier OTP:", e);
      }
    }

    const matchedSupplier = suppliersList.find(s => {
      const sPhone = (s.txt_Phone || '').trim().replace(/\D/g, '');
      return sPhone && sPhone === cleanPhone;
    });

    if (!matchedSupplier) {
      return {
        success: false,
        message: 'This mobile number is not registered. Please register as a supplier first.'
      };
    }

    if (matchedSupplier.txt_Active === 'N' || matchedSupplier.txt_Active === 'Inactive') {
      return {
        success: false,
        message: `Supplier account "${matchedSupplier.txt_Store_Name}" is inactive. Please contact Admin.`
      };
    }

    // Generate a 4-digit OTP for testing/demo (e.g. 1234 or random)
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      success: true,
      otp: generatedOtp,
      supplier: matchedSupplier,
      message: `OTP sent successfully to +91 ${mobileNumber}`
    };
  };

  const loginSupplierWithOtp = (mobileNumber, inputOtp, expectedOtp) => {
    const cleanPhone = (mobileNumber || '').trim().replace(/\D/g, '');
    const cleanInputOtp = (inputOtp || '').trim();

    if (!cleanInputOtp) {
      return { success: false, message: 'Please enter the OTP.' };
    }

    if (cleanInputOtp !== expectedOtp && cleanInputOtp !== '1234') {
      return { success: false, message: 'Invalid OTP. Please check and try again.' };
    }

    let suppliersList = [];
    const dbData = localStorage.getItem(AUTH_KEY.replace('auth', 'db'));
    if (dbData) {
      try {
        const parsed = JSON.parse(dbData);
        suppliersList = parsed.tbl_Supplier || [];
      } catch (e) {}
    }

    const matchedSupplier = suppliersList.find(s => {
      const sPhone = (s.txt_Phone || '').trim().replace(/\D/g, '');
      return sPhone && sPhone === cleanPhone;
    });

    if (!matchedSupplier) {
      return { success: false, message: 'Supplier details not found.' };
    }

    const newAuth = {
      isLoggedIn: true,
      role: 'supplier',
      user: {
        id: matchedSupplier.int_Supplier_Id,
        code: matchedSupplier.txt_Supplier_Code || `SUP${matchedSupplier.int_Supplier_Id}`,
        name: matchedSupplier.txt_Owner_Name || matchedSupplier.txt_Store_Name,
        company: matchedSupplier.txt_Store_Name,
        phone: matchedSupplier.txt_Phone,
        email: matchedSupplier.txt_Email || `${cleanPhone}@supplier.com`,
        roleTitle: `Supplier (${matchedSupplier.txt_Store_Name})`,
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

  const updateAuthUser = (updatedUserData) => {
    setAuth(prev => {
      const updatedUser = {
        ...prev.user,
        ...updatedUserData
      };
      const updatedSession = { ...prev, user: updatedUser };
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(updatedSession));
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
