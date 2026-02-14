// backend/src/controllers/fileController.js (MongoDB version)
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_CONFIG } = require('../config/s3Config');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload file directly to S3 with MongoDB tracking
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
    const folder = req.body.folder || '';
    
    const userId = req.user.id;
    
    // Generate unique file name
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
    
    // Construct file path
    let fileKey;
    if (folder && folder.trim() !== '') {
      const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-_\/]/g, '_');
      fileKey = `users/${userId}/${sanitizedFolder}/${fileName}`;
    } else {
      fileKey = `users/${userId}/${fileName}`;
    }

    // Upload to S3
    const uploadParams = {
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        uploadDate: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const fileUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileKey}`;
    
    // Save file metadata to MongoDB
    const fileRecord = await File.create({
      fileName: file.originalname,
      fileKey,
      fileUrl,
      folder: folder || 'root',
      size: file.size,
      contentType: file.mimetype,
      isPublic,
      uploadedBy: userId,
      uploadedByEmail: req.user.email,
    });

    const response = {
      success: true,
      data: {
        id: fileRecord._id,
        fileName: fileRecord.fileName,
        fileKey: fileRecord.fileKey,
        fileUrl: fileRecord.fileUrl,
        folder: fileRecord.folder,
        size: fileRecord.size,
        contentType: fileRecord.contentType,
        uploadedBy: userId,
        createdAt: fileRecord.createdAt,
      },
    };

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
    const folder = req.body.folder || '';
    const userId = req.user.id;

    const uploadPromises = req.files.map(async (file) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
      
      let fileKey;
      if (folder && folder.trim() !== '') {
        const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-_\/]/g, '_');
        fileKey = `users/${userId}/${sanitizedFolder}/${fileName}`;
      } else {
        fileKey = `users/${userId}/${fileName}`;
      }

      const uploadParams = {
        Bucket: S3_CONFIG.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: isPublic ? 'public-read' : 'private',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const fileUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileKey}`;

      // Save to MongoDB
      const fileRecord = await File.create({
        fileName: file.originalname,
        fileKey,
        fileUrl,
        folder: folder || 'root',
        size: file.size,
        contentType: file.mimetype,
        isPublic,
        uploadedBy: userId,
        uploadedByEmail: req.user.email,
      });

      return {
        id: fileRecord._id,
        fileName: fileRecord.fileName,
        fileKey: fileRecord.fileKey,
        fileUrl: fileRecord.fileUrl,
        size: fileRecord.size,
        contentType: fileRecord.contentType,
        folder: fileRecord.folder,
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

/**
 * Generate pre-signed URL
 */
const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, isPublic, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required',
      });
    }

    const userId = req.user.id;
    
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
    
    let fileKey;
    if (folder && folder.trim() !== '') {
      const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-_\/]/g, '_');
      fileKey = `users/${userId}/${sanitizedFolder}/${uniqueFileName}`;
    } else {
      fileKey = `users/${userId}/${uniqueFileName}`;
    }

    const uploadParams = {
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
      ContentType: fileType,
      ACL: isPublic ? 'public-read' : 'private',
      Metadata: {
        originalName: fileName,
        uploadedBy: userId,
        uploadDate: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    const fileUrl = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${fileKey}`;

    // Pre-create file record in MongoDB
    const fileRecord = await File.create({
      fileName,
      fileKey,
      fileUrl,
      folder: folder || 'root',
      size: 0, // Will be updated if needed
      contentType: fileType,
      isPublic: isPublic || false,
      uploadedBy: userId,
      uploadedByEmail: req.user.email,
    });

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        fileUrl,
        folder: folder || 'root',
        fileId: fileRecord._id,
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
 * Get file URL with authorization
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

    // Find file in database
    const fileRecord = await File.findOne({ fileKey });
    
    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check authorization
    if (fileRecord.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Increment download count
    await fileRecord.incrementDownload();

    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: duration });

    res.status(200).json({
      success: true,
      data: {
        url,
        expiresIn: duration,
        fileName: fileRecord.fileName,
        size: fileRecord.size,
        contentType: fileRecord.contentType,
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
 * Delete file with authorization
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

    // Find file in database
    const fileRecord = await File.findOne({ fileKey });
    
    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check authorization
    if (fileRecord.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: fileKey,
    });
    await s3Client.send(command);

    // Delete from MongoDB
    await fileRecord.deleteOne();

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
 * Delete folder
 */
const deleteFolder = async (req, res) => {
  try {
    const { folder } = req.params;
    const userId = req.user.id;

    if (!folder) {
      return res.status(400).json({
        success: false,
        message: 'Folder path is required',
      });
    }

    const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-_\/]/g, '_');
    
    // Find all files in folder from MongoDB
    const files = await File.find({
      uploadedBy: userId,
      folder: { $regex: `^${sanitizedFolder}` }
    });

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or already empty',
      });
    }

    // Delete from S3
    const deletePromises = files.map(file => {
      const command = new DeleteObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: file.fileKey,
      });
      return s3Client.send(command);
    });

    await Promise.all(deletePromises);

    // Delete from MongoDB
    await File.deleteMany({
      uploadedBy: userId,
      folder: { $regex: `^${sanitizedFolder}` }
    });

    res.status(200).json({
      success: true,
      message: `Folder deleted successfully. ${files.length} file(s) removed.`,
      data: {
        deletedCount: files.length,
      },
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder',
      error: error.message,
    });
  }
};

/**
 * List files from MongoDB
 */
// backend/src/controllers/fileController.js - UPDATE THE listFiles FUNCTION

/**
 * List files from MongoDB with proper folder extraction
 */
const listFiles = async (req, res) => {
  try {
    const folder = req.query.folder || '';
    const userId = req.user.id;

    console.log('Listing files for user:', userId, 'in folder:', folder || 'root');

    // Get files from MongoDB
    const query = { uploadedBy: userId };
    
    if (folder && folder !== 'root') {
      query.folder = folder;
    } else if (!folder || folder === 'root') {
      query.folder = 'root';
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    console.log('Found', files.length, 'files in current folder');

    // Get ALL files to build folder structure
    const allFiles = await File.find({ uploadedBy: userId });
    
    console.log('Total files for user:', allFiles.length);

    // Build unique folders from file paths
    const folderSet = new Set();
    const currentPath = folder || 'root';
    
    allFiles.forEach(file => {
      if (file.folder && file.folder !== 'root') {
        // If we're in root, show top-level folders
        if (currentPath === 'root' || currentPath === '') {
          const topFolder = file.folder.split('/')[0];
          folderSet.add(topFolder);
        } else {
          // If we're in a subfolder, show direct children
          if (file.folder.startsWith(currentPath + '/')) {
            const relativePath = file.folder.substring(currentPath.length + 1);
            const nextFolder = relativePath.split('/')[0];
            if (nextFolder) {
              const fullPath = `${currentPath}/${nextFolder}`;
              folderSet.add(fullPath);
            }
          }
        }
      }
    });

    // Convert to array of folder objects
    const folders = Array.from(folderSet).map(path => {
      const name = path.split('/').pop();
      return {
        name,
        path,
        type: 'folder',
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    console.log('Found', folders.length, 'folders');

    // Filter out folder marker files from the file list
    const visibleFiles = files.filter(file => file.fileName !== '.foldermarker');

    res.status(200).json({
      success: true,
      data: {
        folders,
        files: visibleFiles.map(file => ({
          id: file._id,
          key: file.fileKey,
          name: file.fileName,
          size: file.size,
          contentType: file.contentType,
          folder: file.folder,
          isPublic: file.isPublic,
          downloadCount: file.downloadCount,
          lastModified: file.createdAt,
          url: file.fileUrl,
          type: 'file',
        })),
        currentPath: folder || 'root',
        totalItems: folders.length + visibleFiles.length,
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
 * Create folder
 */
// backend/src/controllers/fileController.js - UPDATE THIS FUNCTION

/**
 * Create folder (creates a marker file so folder is visible)
 */
const createFolder = async (req, res) => {
  try {
    const { folderName } = req.body;
    const userId = req.user.id;

    if (!folderName || folderName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required',
      });
    }

    // Sanitize folder name
    const sanitizedFolderName = folderName
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9-_\/]/g, '_');

    // Create a marker file in S3 to make the folder "exist"
    const folderKey = `users/${userId}/${sanitizedFolderName}/.foldermarker`;

    const uploadParams = {
      Bucket: S3_CONFIG.bucket,
      Key: folderKey,
      Body: '',
      ContentType: 'application/x-empty',
      Metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        type: 'folder-marker',
      },
    };

    // Upload marker file to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // IMPORTANT: Also create a File record in MongoDB so folder appears in list
    await File.create({
      fileName: '.foldermarker',
      fileKey: folderKey,
      fileUrl: `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${folderKey}`,
      folder: sanitizedFolderName,
      size: 0,
      contentType: 'application/x-empty',
      isPublic: false,
      uploadedBy: userId,
      uploadedByEmail: req.user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: {
        folderName: sanitizedFolderName,
        folderPath: `users/${userId}/${sanitizedFolderName}`,
      },
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: error.message,
    });
  }
};


/**
 * Get user storage stats
 */
const getStorageStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await File.getUserStorageSize(userId);

    res.status(200).json({
      success: true,
      data: {
        totalSize: stats.totalSize,
        totalFiles: stats.count,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get storage stats',
      error: error.message,
    });
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  generatePresignedUrl,
  getFileUrl,
  deleteFile,
  deleteFolder,
  listFiles,
  createFolder,
  getStorageStats,
};