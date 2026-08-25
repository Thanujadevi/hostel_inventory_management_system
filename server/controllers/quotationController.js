import { QuotationModel } from '../models/QuotationModel.js';

export const quotationController = {
  async getAll(req, res) {
    try {
      const quotations = await QuotationModel.getAll();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const newQuo = await QuotationModel.create(req.body);
      res.json(newQuo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status, remarks } = req.body;
      const updated = await QuotationModel.updateStatus(req.params.id, status, remarks);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
