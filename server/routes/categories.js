import express from 'express';
import { categoryController } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', categoryController.getAll);
router.post('/', categoryController.createOrUpdate);
router.delete('/:id', categoryController.delete);

export default router;
