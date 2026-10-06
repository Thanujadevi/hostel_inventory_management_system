import { RequirementModel } from '../models/RequirementModel.js';

export const requirementController = {
  async getAll(req, res) {
    try {
      const requirements = await RequirementModel.getAll();
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const newReq = await RequirementModel.create(req.body);
      res.json({ success: true, ...newReq });
    } catch (error) {
      console.error("Error creating requirement request:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status, remarks } = req.body;
      const updated = await RequirementModel.updateStatus(req.params.id, status, remarks);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
