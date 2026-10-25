import express from 'express';
import { purchaseController } from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', purchaseController.getAll);
router.post('/', purchaseController.create);
router.put('/:id/status', purchaseController.updateStatus);

export default router;
