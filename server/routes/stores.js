import express from 'express';
import { storeController } from '../controllers/storeController.js';

const router = express.Router();

router.get('/', storeController.getAll);
router.get('/:id', storeController.getById);
router.post('/', storeController.createOrUpdate);
router.delete('/:id', storeController.delete);

export default router;
