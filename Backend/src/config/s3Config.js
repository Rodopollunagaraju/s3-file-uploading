// backend/src/config/s3Config.js
const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Initialize S3 client with AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_CONFIG = {
  bucket: process.env.S3_BUCKET_NAME,
  region: process.env.AWS_REGION || 'us-east-1',
  // URL expiration time in seconds (default 1 hour)
  signedUrlExpiration: parseInt(process.env.SIGNED_URL_EXPIRATION) || 3600,
};

module.exports = {
  s3Client,
  S3_CONFIG,
};