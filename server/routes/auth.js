import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/google-admin
router.post('/google-admin', authController.googleAdminLogin);

export default router;
