// frontend/src/components/FileList.jsx - WITH BACK NAVIGATION
import React, { useState } from 'react';
import { deleteFile, getFileUrl } from '../services/uploadService';
import '../styles/FileList.css';

const FileList = ({ 
  files = [], 
  folders = [], 
  loading, 
  onFileDeleted, 
  onFolderClick, 
  currentFolder,
  onNavigateUp 
}) => {
  const [deletingFile, setDeletingFile] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async (fileKey, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeletingFile(fileKey);
    setError(null);

    try {
      await deleteFile(fileKey);
      
      if (onFileDeleted) {
        onFileDeleted();
      }
      
      alert('✅ File deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete ${fileName}: ${err.message}`);
      alert(`❌ Failed to delete file: ${err.message}`);
    } finally {
      setDeletingFile(null);
    }
  };

  const handleView = async (fileKey, fileName) => {
    try {
      const response = await getFileUrl(fileKey);
      window.open(response.data.url, '_blank');
    } catch (err) {
      setError(`Failed to get URL for ${fileName}: ${err.message}`);
      alert(`❌ Failed to view file: ${err.message}`);
    }
  };

  const handleDownload = async (fileKey, fileName) => {
    try {
      const response = await getFileUrl(fileKey);
      const link = document.createElement('a');
      link.href = response.data.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(`Failed to download ${fileName}: ${err.message}`);
      alert(`❌ Failed to download file: ${err.message}`);
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
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (contentType) => {
    if (!contentType) return '📄';
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📕';
    if (contentType.includes('word') || contentType.includes('document')) return '📘';
    if (contentType.includes('sheet') || contentType.includes('excel')) return '📗';
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📙';
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z')) return '📦';
    if (contentType.includes('text')) return '📝';
    return '📄';
  };

  if (loading) {
    return (
      <div className="file-list-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  const totalItems = folders.length + files.length;
  const canGoBack = currentFolder && currentFolder !== 'root';

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <div className="header-title-section">
          {canGoBack && (
            <button 
              className="back-button" 
              onClick={onNavigateUp}
              title="Go back to parent folder"
            >
              ⬅️
            </button>
          )}
          <h2>
            📂 {currentFolder === 'root' || !currentFolder ? 'All Files' : currentFolder}
          </h2>
        </div>
        <span className="item-count">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="error-close">✕</button>
        </div>
      )}

      {totalItems === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-title">No files here</p>
          <p className="empty-subtitle">
            {currentFolder === 'root' || !currentFolder 
              ? 'Upload files to get started' 
              : 'This folder is empty'}
          </p>
        </div>
      ) : (
        <div className="file-list">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="folders-section">
              <h3 className="section-title">Folders</h3>
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  className="file-list-item folder-item"
                  onClick={() => onFolderClick && onFolderClick(folder.path)}
                >
                  <div className="file-list-info">
                    <div className="file-icon-large">📁</div>
                    <div className="file-details-section">
                      <div className="file-list-name">{folder.name}</div>
                      <div className="file-list-meta">
                        <span>Folder</span>
                      </div>
                    </div>
                  </div>
                  <div className="file-list-actions">
                    <button className="action-btn navigate-btn" title="Open folder">
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div className="files-section">
              {folders.length > 0 && <h3 className="section-title">Files</h3>}
              {files.map((file) => (
                <div key={file.key} className="file-list-item">
                  <div className="file-list-info">
                    <div className="file-icon-large">{getFileIcon(file.contentType)}</div>
                    <div className="file-details-section">
                      <div className="file-list-name" title={file.name}>
                        {file.name}
                      </div>
                      <div className="file-list-meta">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.lastModified)}</span>
                        {file.downloadCount > 0 && (
                          <>
                            <span>•</span>
                            <span>⬇️ {file.downloadCount}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="file-list-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleView(file.key, file.name)}
                      title="View file"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn download-btn"
                      onClick={() => handleDownload(file.key, file.name)}
                      title="Download file"
                    >
                      ⬇️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(file.key, file.name)}
                      disabled={deletingFile === file.key}
                      title="Delete file"
                    >
                      {deletingFile === file.key ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileList;