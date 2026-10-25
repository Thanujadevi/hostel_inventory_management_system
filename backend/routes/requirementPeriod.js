import express from 'express';
import { RequirementPeriodModel } from '../models/RequirementPeriodModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const period = await RequirementPeriodModel.getCurrent();
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const updated = await RequirementPeriodModel.savePeriod(req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/toggle', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await RequirementPeriodModel.toggleStatus(status);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
