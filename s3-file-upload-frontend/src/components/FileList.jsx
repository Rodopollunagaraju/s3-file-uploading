// frontend/src/components/FileList.jsx
import React, { useState, useEffect } from 'react';
import { listFiles, deleteFile, getFileUrl } from '../services/uploadService';
import '../styles/FileList.css';

const FileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listFiles();
      setFiles(response.data.files);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileKey) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingFile(fileKey);
    try {
      await deleteFile(fileKey);
      setFiles((prev) => prev.filter((file) => file.key !== fileKey));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingFile(null);
    }
  };

  const handleGetUrl = async (fileKey) => {
    try {
      const response = await getFileUrl(fileKey);
      window.open(response.data.url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getFileName = (key) => {
    return key.split('/').pop();
  };

  if (loading) {
    return (
      <div className="file-list-container">
        <div className="loading">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h2>Uploaded Files ({files.length})</h2>
        <button className="refresh-btn" onClick={fetchFiles}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="empty-state">
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.key} className="file-list-item">
              <div className="file-list-info">
                <div className="file-list-name">
                  📄 {getFileName(file.key)}
                </div>
                <div className="file-list-meta">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.lastModified)}</span>
                </div>
              </div>
              <div className="file-list-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleGetUrl(file.key)}
                  title="View file"
                >
                  👁️ View
                </button>
                <a
                  href={file.url}
                  download
                  className="action-btn download-btn"
                  title="Download file"
                >
                  ⬇️ Download
                </a>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(file.key)}
                  disabled={deletingFile === file.key}
                  title="Delete file"
                >
                  {deletingFile === file.key ? '...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;