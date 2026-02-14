// backend/src/server.js (MongoDB version)
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     S3 File Upload System - MongoDB Version       ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: MongoDB`);
  console.log(`🪣 S3 Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🔐 JWT Authentication: ${process.env.JWT_SECRET ? 'Enabled ✅' : 'Disabled ❌'}`);
  console.log('');
  console.log('📚 API Documentation:');
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`   Files API: http://localhost:${PORT}/api/files`);
  console.log('');
});

module.exports = app;