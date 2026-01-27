// backend/src/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const {
  uploadFile,
  generatePresignedUrl,
  getFileUrl,
  deleteFile,
  listFiles,
  uploadMultipleFiles,
} = require('../controllers/fileController');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');

// Upload single file
router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  uploadFile
);

// Upload multiple files
router.post(
  '/upload-multiple',
  upload.array('files', 10), // Max 10 files
  handleMulterError,
  uploadMultipleFiles
);

// Generate pre-signed URL for client-side upload
router.post('/presigned-url', generatePresignedUrl);

// Get private file URL
router.get('/url/:fileKey(*)', getFileUrl);

// Delete file
router.delete('/:fileKey(*)', deleteFile);

// List files
router.get('/', listFiles);

module.exports = router;