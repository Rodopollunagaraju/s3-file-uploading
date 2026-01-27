// backend/src/middleware/uploadMiddleware.js
const multer = require('multer');

// Configure multer to use memory storage (files stored in buffer)
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Get allowed file types from env or use defaults
  const allowedTypes = process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // Default 10MB
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the limit',
        error: err.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Unknown error occurred',
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
};