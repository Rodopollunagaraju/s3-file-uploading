// frontend/src/services/uploadService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api/files`,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Upload file directly to server (server uploads to S3)
 */
export const uploadFile = async (file, isPublic = false, folder = '', onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('isPublic', isPublic);
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'File upload failed'
    );
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (files, isPublic = false, folder = '', onProgress) => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  formData.append('isPublic', isPublic);
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await api.post('/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Multiple file upload failed'
    );
  }
};

/**
 * Get pre-signed URL and upload directly to S3
 */
export const uploadWithPresignedUrl = async (file, isPublic = false, folder = '', onProgress) => {
  try {
    // Step 1: Get pre-signed URL from backend
    const presignedResponse = await api.post('/presigned-url', {
      fileName: file.name,
      fileType: file.type,
      isPublic,
      folder,
    });

    const { uploadUrl, fileKey, fileUrl } = presignedResponse.data.data;

    // Step 2: Upload directly to S3 using pre-signed URL
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return {
      success: true,
      data: {
        fileName: file.name,
        fileKey,
        fileUrl,
        folder: folder || 'root',
        size: file.size,
        contentType: file.type,
      },
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Pre-signed URL upload failed'
    );
  }
};

/**
 * Get temporary URL for private file
 */
export const getFileUrl = async (fileKey, duration = 3600) => {
  try {
    const response = await api.get(`/url/${fileKey}`, {
      params: { duration },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to get file URL'
    );
  }
};

/**
 * Delete file from S3
 */
export const deleteFile = async (fileKey) => {
  try {
    const response = await api.delete(`/${fileKey}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete file'
    );
  }
};

/**
 * Delete folder from S3
 */
export const deleteFolder = async (folderPath) => {
  try {
    const response = await api.delete(`/folders/${folderPath}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete folder'
    );
  }
};

/**
 * List all files in bucket or specific folder
 */
export const listFiles = async (folder = '', maxKeys = 1000) => {
  try {
    const response = await api.get('/', {
      params: { folder, maxKeys },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to list files'
    );
  }
};

/**
 * Create a new folder
 */
export const createFolder = async (folderName) => {
  try {
    const response = await api.post('/folders', {
      folderName,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to create folder'
    );
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file, maxSizeMB = 10) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }

  return true;
};

export default {
  uploadFile,
  uploadMultipleFiles,
  uploadWithPresignedUrl,
  getFileUrl,
  deleteFile,
  deleteFolder,
  listFiles,
  createFolder,
  validateFile,
};