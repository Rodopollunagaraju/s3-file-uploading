// backend/src/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const {
  uploadFile,
  generatePresignedUrl,
  getFileUrl,
  deleteFile,
  deleteFolder,
  listFiles,
  uploadMultipleFiles,
  createFolder,
} = require('../controllers/fileController');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

// Protected routes - require authentication

// Create folder
router.post('/folders', authenticateToken, createFolder);

// Delete folder
router.delete('/folders/:folder(*)', authenticateToken, deleteFolder);

// Upload single file
router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  handleMulterError,
  uploadFile
);

// Upload multiple files
router.post(
  '/upload-multiple',
  authenticateToken,
  upload.array('files', 10),
  handleMulterError,
  uploadMultipleFiles
);

// Generate pre-signed URL for client-side upload
router.post('/presigned-url', authenticateToken, generatePresignedUrl);

// Get private file URL
router.get('/url/:fileKey(*)', authenticateToken, getFileUrl);

// Delete file
router.delete('/:fileKey(*)', authenticateToken, deleteFile);

// List files (supports folders via query params)
router.get('/', authenticateToken, listFiles);

module.exports = router;