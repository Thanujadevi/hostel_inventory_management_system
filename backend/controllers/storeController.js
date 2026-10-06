import { StoreModel } from '../models/StoreModel.js';

export const storeController = {
  async getAll(req, res) {
    try {
      const stores = await StoreModel.getAll();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const store = await StoreModel.findById(req.params.id);
      if (!store) return res.status(404).json({ message: 'Store not found' });
      res.json(store);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createOrUpdate(req, res) {
    try {
      const storeData = req.body;
      if (storeData.int_Store_Id) {
        await StoreModel.update(storeData.int_Store_Id, storeData);
      } else {
        await StoreModel.create(storeData);
      }
      const updatedList = await StoreModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await StoreModel.delete(req.params.id);
      const updatedList = await StoreModel.getAll();
      res.json(updatedList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
