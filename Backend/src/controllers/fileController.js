// backend/src/controllers/fileController.js
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_CONFIG } = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload file directly to S3
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const file = req.file;
    const isPublic = req.body.isPublic === 'true';
    
    // Generate unique file name
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
    const fileKey = `uploads/${fileName}`;

    // Upload parameters
    const uploadParams = {
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Set ACL based on public/private preference
      ACL: isPublic ? 'public-read' : 'private',
    };

    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct file URLs
    const fileUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileKey}`;
    
    const response = {
      success: true,
      data: {
        fileName: file.originalname,
        fileKey: fileKey,
        fileUrl: fileUrl,
        size: file.size,
        contentType: file.mimetype,
      },
    };

    // Add public URL if file is public
    if (isPublic) {
      response.data.publicUrl = fileUrl;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
};

/**
 * Generate pre-signed URL for client-side upload
 */
const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, isPublic } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required',
      });
    }

    // Generate unique file name
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
    const fileKey = `uploads/${uniqueFileName}`;

    const uploadParams = {
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
      ContentType: fileType,
      ACL: isPublic ? 'public-read' : 'private',
    };

    const command = new PutObjectCommand(uploadParams);
    
    // Generate pre-signed URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    const fileUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileKey}`;

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        fileUrl,
      },
    });
  } catch (error) {
    console.error('Pre-signed URL generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate pre-signed URL',
      error: error.message,
    });
  }
};

/**
 * Get private file URL with expiration
 */
const getFileUrl = async (req, res) => {
  try {
    const { fileKey } = req.params;
    const duration = parseInt(req.query.duration) || S3_CONFIG.signedUrlExpiration;

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'fileKey is required',
      });
    }

    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: duration,
    });

    res.status(200).json({
      success: true,
      data: {
        url,
        expiresIn: duration,
      },
    });
  } catch (error) {
    console.error('Get file URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate file URL',
      error: error.message,
    });
  }
};

/**
 * Delete file from S3
 */
const deleteFile = async (req, res) => {
  try {
    const { fileKey } = req.params;

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: 'fileKey is required',
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
    });

    await s3Client.send(command);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message,
    });
  }
};

/**
 * List files in S3 bucket
 */
const listFiles = async (req, res) => {
  try {
    const prefix = req.query.prefix || 'uploads/';
    const maxKeys = parseInt(req.query.maxKeys) || 100;

    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((file) => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      url: `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${file.Key}`,
    }));

    res.status(200).json({
      success: true,
      data: {
        files,
        count: files.length,
      },
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files',
      error: error.message,
    });
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      });
    }

    const isPublic = req.body.isPublic === 'true';
    const uploadPromises = req.files.map(async (file) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
      const fileKey = `uploads/${fileName}`;

      const uploadParams = {
        Bucket: S3_CONFIG.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: isPublic ? 'public-read' : 'private',
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const fileUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileKey}`;

      return {
        fileName: file.originalname,
        fileKey,
        fileUrl,
        size: file.size,
        contentType: file.mimetype,
        publicUrl: isPublic ? fileUrl : undefined,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length,
      },
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Multiple file upload failed',
      error: error.message,
    });
  }
};

module.exports = {
  uploadFile,
  generatePresignedUrl,
  getFileUrl,
  deleteFile,
  listFiles,
  uploadMultipleFiles,
};