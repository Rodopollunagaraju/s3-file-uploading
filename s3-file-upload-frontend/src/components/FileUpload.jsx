// frontend/src/components/FileUpload.jsx
import React, { useState, useRef } from 'react';
import { uploadFile, uploadWithPresignedUrl, validateFile } from '../services/uploadService';
import '../styles/FileUpload.css';

const FileUpload = ({ onUploadSuccess, uploadMethod = 'direct', currentFolder, folders = [] }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isPublic, setIsPublic] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(currentFolder || '');
  const [fileRenames, setFileRenames] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const validFiles = [];
    const newErrors = [];
    const newRenames = { ...fileRenames };

    Array.from(files).forEach((file) => {
      try {
        validateFile(file);
        validFiles.push(file);
        // Initialize with original filename
        newRenames[file.name + file.lastModified] = file.name;
      } catch (error) {
        newErrors.push(`${file.name}: ${error.message}`);
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFileRenames(newRenames);
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
    const fileToRemove = selectedFiles[index];
    const renameKey = fileToRemove.name + fileToRemove.lastModified;
    
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
    setFileRenames((prev) => {
      const newRenames = { ...prev };
      delete newRenames[renameKey];
      return newRenames;
    });
  };

  const handleRenameChange = (file, newName) => {
    const renameKey = file.name + file.lastModified;
    setFileRenames((prev) => ({
      ...prev,
      [renameKey]: newName,
    }));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setErrors([]);

    const uploadPromises = selectedFiles.map(async (file, index) => {
      try {
        const renameKey = file.name + file.lastModified;
        const newFileName = fileRenames[renameKey] || file.name;
        
        // Create a new file with the renamed name
        const renamedFile = new File([file], newFileName, { type: file.type });
        
        const uploadFn = uploadMethod === 'presigned' ? uploadWithPresignedUrl : uploadFile;
        
        const result = await uploadFn(
          renamedFile,
          isPublic,
          selectedFolder,
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [index]: progress,
            }));
          }
        );

        return { success: true, file: newFileName, data: result.data };
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
    setFileRenames({});
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
      {/* Folder Selection */}
      <div className="folder-selection">
        <label htmlFor="folder-select">Upload to folder:</label>
        <select
          id="folder-select"
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="folder-select"
          disabled={uploading}
        >
          <option value="">📁 Root Folder</option>
          {folders.map((folder) => (
            <option key={folder.path} value={folder.path}>
              📁 {folder.path}
            </option>
          ))}
        </select>
      </div>

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
          {selectedFiles.map((file, index) => {
            const renameKey = file.name + file.lastModified;
            return (
              <div key={renameKey} className="file-item">
                <div className="file-info-section">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <input
                      type="text"
                      value={fileRenames[renameKey] || file.name}
                      onChange={(e) => handleRenameChange(file, e.target.value)}
                      className="file-rename-input"
                      disabled={uploading}
                      placeholder="File name"
                    />
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
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
                    title="Remove file"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
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
        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s) to ${selectedFolder || 'root'}`}
      </button>
    </div>
  );
};

export default FileUpload;