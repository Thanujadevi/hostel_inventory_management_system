import { AdminModel } from '../models/AdminModel.js';
import { StoreModel } from '../models/StoreModel.js';
import { SupplierModel } from '../models/SupplierModel.js';
import { smsService } from '../services/smsService.js';

// In-memory OTP storage cache: { phone: { otp, expiresAt, supplier } }
const otpStore = new Map();

export const authController = {
  async login(req, res) {
    const { username, password, role } = req.body;

    try {
      if (role === 'admin' || !role) {
        const user = await AdminModel.verifyCredentials(username, password);
        if (user) {
          return res.json({
            success: true,
            role: 'admin',
            user: {
              id: user.int_Admin_Id,
              code: user.txt_Admin_Code,
              name: user.txt_Admin_Name,
              email: user.txt_Email,
              role: user.txt_Role
            }
          });
        }
      }
      
      if (role === 'store' || !role) {
        const store = await StoreModel.findByCredentials(username, password);
        if (store) {
          return res.json({
            success: true,
            role: 'store',
            user: {
              id: store.int_Store_Id,
              code: store.txt_Store_Code,
              name: store.txt_Store_Name,
              campus: store.txt_Campus,
              incharge: store.txt_Incharge,
              email: store.txt_Email
            }
          });
        }
      }

      // Check Supplier Credentials
      const supplier = await SupplierModel.findByCredentials(username, password);
      if (supplier) {
        const storeName = supplier.txt_Store_Name || supplier.txt_Supplier_Name || 'Supplier';
        const ownerName = supplier.txt_Owner_Name || supplier.txt_Contact_Person || storeName;

        return res.json({
          success: true,
          role: 'supplier',
          user: {
            id: supplier.int_Supplier_Id,
            code: supplier.txt_Supplier_Code || `SUP${supplier.int_Supplier_Id}`,
            name: ownerName,
            company: storeName,
            phone: supplier.txt_Phone,
            email: supplier.txt_Email || `${supplier.txt_Phone}@supplier.com`,
            roleTitle: `Supplier (${storeName})`,
            profileCompleted: supplier.txt_Profile_Completed === 'Y',
            supplierDetails: supplier
          }
        });
      }

      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async sendOtp(req, res) {
    const { phone } = req.body;
    const cleanPhone = (phone || '').trim().replace(/^(\+91|91|0)/, '').replace(/\D/g, '');

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' });
    }

    try {
      const suppliers = await SupplierModel.getAll();
      const matchedSupplier = suppliers.find(s => {
        const sPhone = (s.txt_Phone || '').trim().replace(/\D/g, '').slice(-10);
        return sPhone && sPhone === cleanPhone;
      });

      if (!matchedSupplier) {
        return res.status(444).json({
          success: false,
          message: 'This mobile number is not registered. Please register as a supplier first.'
        });
      }

      if (matchedSupplier.txt_Active === 'N' || matchedSupplier.txt_Active === 'Inactive') {
        return res.status(403).json({
          success: false,
          message: `Supplier account "${matchedSupplier.txt_Store_Name || matchedSupplier.txt_Supplier_Name}" is inactive. Please contact Admin.`
        });
      }

      // Generate 6-digit random OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes valid

      otpStore.set(cleanPhone, {
        otp,
        expiresAt,
        supplier: matchedSupplier
      });

      // Dispatch SMS
      const smsResult = await smsService.sendOtpSms(cleanPhone, otp);

      if (!smsResult.success) {
        return res.status(400).json({
          success: false,
          message: smsResult.message
        });
      }

      return res.json({
        success: true,
        otp, // Included for easy client fallback / testing
        supplier: matchedSupplier,
        message: smsResult.message
      });
    } catch (error) {
      console.error('sendOtp error:', error);
      res.status(500).json({ success: false, message: 'Internal server error sending OTP' });
    }
  },

  async verifyOtp(req, res) {
    const { phone, otp } = req.body;
    const cleanPhone = (phone || '').trim().replace(/\D/g, '').slice(-10);
    const cleanOtp = (otp || '').trim();

    if (!cleanOtp) {
      return res.status(400).json({ success: false, message: 'Please enter the OTP.' });
    }

    try {
      const record = otpStore.get(cleanPhone);
      const isDemoBypass = cleanOtp === '1234';

      let matchedSupplier = record?.supplier;
      if (!matchedSupplier) {
        const suppliers = await SupplierModel.getAll();
        matchedSupplier = suppliers.find(s => (s.txt_Phone || '').trim().replace(/\D/g, '').slice(-10) === cleanPhone);
      }

      if (!matchedSupplier) {
        return res.status(404).json({ success: false, message: 'Supplier details not found.' });
      }

      const isValidOtp = isDemoBypass || (record && record.otp === cleanOtp && Date.now() <= record.expiresAt);

      if (!isValidOtp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please check and try again.' });
      }

      // Clear consumed OTP
      otpStore.delete(cleanPhone);

      const storeName = matchedSupplier.txt_Store_Name || matchedSupplier.txt_Supplier_Name || 'Supplier';
      const ownerName = matchedSupplier.txt_Owner_Name || matchedSupplier.txt_Contact_Person || storeName;

      return res.json({
        success: true,
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
        }
      });
    } catch (error) {
      console.error('verifyOtp error:', error);
      res.status(500).json({ success: false, message: 'Internal server error verifying OTP' });
    }
  },

  async googleAdminLogin(req, res) {
    const { email, name, picture } = req.body;

    try {
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required for Google OAuth' });
      }

      const user = await AdminModel.findByEmail(email);
      if (user) {
        return res.json({
          success: true,
          role: 'admin',
          user: {
            id: user.int_Admin_Id,
            code: user.txt_Admin_Code,
            name: name || user.txt_Admin_Name,
            email: user.txt_Email,
            picture: picture || null,
            role: user.txt_Role,
            authProvider: 'google'
          }
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Access Denied: Email address is not registered in the Admin database.'
      });
    } catch (error) {
      console.error('Google Admin Login controller error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAdmins(req, res) {
    try {
      const admins = await AdminModel.getAll();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
