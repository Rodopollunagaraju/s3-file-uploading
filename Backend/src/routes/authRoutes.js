// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout,
  getAllUsers,
} = require('../controllers/authController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', authenticateToken, getCurrentUser);
router.post('/refresh', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);

// Admin only routes
router.get('/users', authenticateToken, isAdmin, getAllUsers);

module.exports = router;