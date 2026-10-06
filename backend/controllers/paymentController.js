import { PaymentModel } from '../models/PaymentModel.js';

export const paymentController = {
  async getAll(req, res) {
    try {
      const payments = await PaymentModel.getAll();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const newPayment = await PaymentModel.create(req.body);
      res.json(newPayment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
