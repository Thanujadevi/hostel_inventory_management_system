import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// GET /api/auth/admins
router.get('/admins', authController.getAdmins);

export default router;
