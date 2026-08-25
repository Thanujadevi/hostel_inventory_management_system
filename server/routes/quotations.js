import express from 'express';
import { quotationController } from '../controllers/quotationController.js';

const router = express.Router();

router.get('/', quotationController.getAll);
router.post('/', quotationController.create);
router.put('/:id/status', quotationController.updateStatus);

export default router;
