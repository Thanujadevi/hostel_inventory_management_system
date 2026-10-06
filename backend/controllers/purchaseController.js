import { PurchaseModel } from '../models/PurchaseModel.js';

export const purchaseController = {
  async getAll(req, res) {
    try {
      const purchases = await PurchaseModel.getAll();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const newPO = await PurchaseModel.create(req.body);
      res.json(newPO);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status, paymentStatus } = req.body;
      const updated = await PurchaseModel.updateStatus(req.params.id, status, paymentStatus);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
