// frontend/src/components/FileUpload.jsx
import React, { useState, useRef } from 'react';
import { uploadFile, uploadWithPresignedUrl, validateFile } from '../services/uploadService';
import '../styles/FileUpload.css';

const FileUpload = ({ onUploadSuccess, uploadMethod = 'direct' }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isPublic, setIsPublic] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const validFiles = [];
    const newErrors = [];

    Array.from(files).forEach((file) => {
      try {
        validateFile(file);
        validFiles.push(file);
      } catch (error) {
        newErrors.push(`${file.name}: ${error.message}`);
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setErrors(newErrors);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setErrors([]);

    const uploadPromises = selectedFiles.map(async (file, index) => {
      try {
        const uploadFn = uploadMethod === 'presigned' ? uploadWithPresignedUrl : uploadFile;
        
        const result = await uploadFn(
          file,
          isPublic,
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [index]: progress,
            }));
          }
        );

        return { success: true, file: file.name, data: result.data };
      } catch (error) {
        return { success: false, file: file.name, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter((r) => r.success);
    const failedUploads = results.filter((r) => !r.success);

    if (failedUploads.length > 0) {
      setErrors(failedUploads.map((f) => `${f.file}: ${f.error}`));
    }

    if (successfulUploads.length > 0 && onUploadSuccess) {
      onUploadSuccess(successfulUploads.map((u) => u.data));
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress({});
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <div className="drop-zone-content">
          <svg
            className="upload-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="drop-zone-text">
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="drop-zone-subtext">or click to browse</p>
          <p className="drop-zone-info">Max file size: 10MB</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="error-list">
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h3>Selected Files ({selectedFiles.length})</h3>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              {uploadProgress[index] !== undefined && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress[index]}%` }}
                  >
                    {uploadProgress[index]}%
                  </div>
                </div>
              )}
              {!uploading && (
                <button
                  className="remove-btn"
                  onClick={() => removeFile(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="upload-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={uploading}
          />
          <span>Make files publicly accessible</span>
        </label>
      </div>

      <button
        className="upload-btn"
        onClick={uploadFiles}
        disabled={uploading || selectedFiles.length === 0}
      >
        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
      </button>
    </div>
  );
};

export default FileUpload;