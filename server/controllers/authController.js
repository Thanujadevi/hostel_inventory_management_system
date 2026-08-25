import { AdminModel } from '../models/AdminModel.js';
import { StoreModel } from '../models/StoreModel.js';
import { SupplierModel } from '../models/SupplierModel.js';

export const authController = {
  async login(req, res) {
    const { username, password, role } = req.body;

    try {
      if (role === 'admin') {
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
      } else if (role === 'store') {
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
      } else if (role === 'supplier') {
        const supplier = await SupplierModel.findByCredentials(username, password);
        if (supplier) {
          return res.json({
            success: true,
            role: 'supplier',
            user: {
              id: supplier.int_Supplier_Id,
              code: supplier.txt_Supplier_Code,
              name: supplier.txt_Supplier_Name,
              email: supplier.txt_Email,
              phone: supplier.txt_Phone,
              profileCompleted: supplier.txt_Profile_Completed === 'Y'
            }
          });
        }
      }

      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({ success: false, message: error.message });
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
  }
};
