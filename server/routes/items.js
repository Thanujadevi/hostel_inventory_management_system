import express from 'express';
import { itemController } from '../controllers/itemController.js';

const router = express.Router();

router.get('/', itemController.getAll);
router.post('/', itemController.createOrUpdate);
router.delete('/:id', itemController.delete);

export default router;
