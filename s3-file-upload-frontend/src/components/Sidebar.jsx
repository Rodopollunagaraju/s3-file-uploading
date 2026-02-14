// frontend/src/components/Sidebar.jsx
import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ user, storageStats, onLogout, onNewFolder, onUpload }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercentage = (storageStats.totalSize / (100 * 1024 * 1024)) * 100; // Assuming 100MB limit

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg viewBox="0 0 24 24" width="40" height="40">
            <path fill="#4285F4" d="M12.5 2.5l6 10.5H6.5z"/>
            <path fill="#EA4335" d="M18.5 13L12.5 2.5 6.5 13z"/>
            <path fill="#FBBC04" d="M6.5 13h12l-6 10.5z"/>
            <path fill="#34A853" d="M12.5 23.5l-6-10.5h12z"/>
          </svg>
          <span className="logo-text">My Drive</span>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="new-button" onClick={onUpload}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span>New</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
          <span>My Drive</span>
        </a>

        <a href="#" className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Starred</span>
        </a>

        <a href="#" className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Recent</span>
        </a>

        <a href="#" className="nav-item">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 3.3c1.49 0 2.7 1.21 2.7 2.7 0 1.49-1.21 2.7-2.7 2.7-1.49 0-2.7-1.21-2.7-2.7 0-1.49 1.21-2.7 2.7-2.7zM18 16H6v-.9c0-2 4-3.1 6-3.1s6 1.1 6 3.1v.9z"/>
          </svg>
          <span>Shared with me</span>
        </a>

        <div className="nav-divider"></div>

        <a href="#" className="nav-item" onClick={onNewFolder}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/>
          </svg>
          <span>New Folder</span>
        </a>
      </nav>

      <div className="sidebar-storage">
        <div className="storage-info">
          <div className="storage-icon">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6v2z"/>
            </svg>
          </div>
          <div className="storage-text">
            <div className="storage-used">
              {formatBytes(storageStats.totalSize)} of 100 MB used
            </div>
            <div className="storage-bar">
              <div 
                className="storage-bar-fill" 
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
            <div className="storage-files">
              {storageStats.totalFiles} files
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button className="logout-button" onClick={onLogout} title="Logout">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;