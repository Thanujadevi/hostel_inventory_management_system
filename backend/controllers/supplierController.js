import { SupplierModel } from '../models/SupplierModel.js';

export const supplierController = {
  async getAll(req, res) {
    try {
      const suppliers = await SupplierModel.getAll();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const supplier = await SupplierModel.findById(req.params.id);
      if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createOrUpdate(req, res) {
    try {
      const sData = req.body;
      if (sData.int_Supplier_Id) {
        await SupplierModel.update(sData.int_Supplier_Id, sData);
      } else {
        await SupplierModel.create(sData);
      }
      const updatedList = await SupplierModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await SupplierModel.delete(req.params.id);
      const updatedList = await SupplierModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
