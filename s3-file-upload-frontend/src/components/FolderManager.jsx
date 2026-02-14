// frontend/src/components/FolderManager.jsx
import React, { useState } from 'react';
import { createFolder, deleteFolder } from '../services/uploadService';
import '../styles/FolderManager.css';

const FolderManager = ({ currentFolder, onFolderChange, folders, onFolderCreated, onFolderDeleted, allFolders = [] }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      let folderPath = newFolderName.trim();
      
      // If we're in a subfolder, prepend the current path
      if (currentFolder && currentFolder !== 'root') {
        folderPath = `${currentFolder}/${folderPath}`;
      }

      await createFolder(folderPath);
      setNewFolderName('');
      setShowCreateModal(false);
      if (onFolderCreated) {
        onFolderCreated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (folderPath, folderName) => {
    if (!window.confirm(`Are you sure you want to delete "${folderName}" and all its contents?`)) {
      return;
    }

    try {
      await deleteFolder(folderPath);
      if (onFolderDeleted) {
        onFolderDeleted();
      }
      alert('Folder deleted successfully!');
    } catch (err) {
      alert(`Failed to delete folder: ${err.message}`);
    }
  };

  const navigateToFolder = (folderPath) => {
    if (onFolderChange) {
      onFolderChange(folderPath);
    }
  };

  const navigateUp = () => {
    if (currentFolder && currentFolder !== 'root') {
      const parts = currentFolder.split('/');
      parts.pop();
      const newPath = parts.length > 0 ? parts.join('/') : 'root';
      onFolderChange(newPath);
    }
  };

  const goToRoot = () => {
    onFolderChange('root');
  };

  // Build breadcrumb parts
  const breadcrumbParts = currentFolder && currentFolder !== 'root' 
    ? currentFolder.split('/') 
    : [];

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      goToRoot();
    } else {
      const parts = breadcrumbParts.slice(0, index + 1);
      onFolderChange(parts.join('/'));
    }
  };

  return (
    <div className="folder-manager">
      <div className="folder-header">
        <div className="breadcrumb">
          <button 
            onClick={goToRoot} 
            className={`breadcrumb-item ${(!currentFolder || currentFolder === 'root') ? 'current' : ''}`}
          >
            🏠 Home
          </button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="breadcrumb-separator">/</span>
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`breadcrumb-item ${index === breadcrumbParts.length - 1 ? 'current' : ''}`}
              >
                📁 {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="folder-actions">
          {currentFolder && currentFolder !== 'root' && (
            <button onClick={navigateUp} className="action-btn-small" title="Go up one level">
              ⬆️ Up
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="create-folder-btn"
            title="Create new folder"
          >
            ➕ New Folder
          </button>
        </div>
      </div>

      {/* Current Location Indicator */}
      <div className="current-location">
        <span className="location-label">Current location:</span>
        <span className="location-path">
          {currentFolder === 'root' || !currentFolder ? '/' : `/${currentFolder}`}
        </span>
      </div>

      {/* Subfolders in current directory */}
      {folders && folders.length > 0 && (
        <div className="folders-grid">
          {folders.map((folder) => (
            <div key={folder.path} className="folder-card">
              <button
                onClick={() => navigateToFolder(folder.path)}
                className="folder-card-button"
                title={`Open ${folder.name}`}
              >
                <div className="folder-card-icon">📁</div>
                <div className="folder-card-name">{folder.name}</div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.path, folder.name);
                }}
                className="folder-delete-btn"
                title="Delete folder"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Navigation - All Folders */}
      {allFolders && allFolders.length > 0 && (
        <div className="quick-navigation">
          <h3 className="quick-nav-title">Quick Navigation</h3>
          <div className="quick-nav-list">
            <button
              onClick={goToRoot}
              className={`quick-nav-item ${(!currentFolder || currentFolder === 'root') ? 'active' : ''}`}
            >
              🏠 Root
            </button>
            {allFolders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => navigateToFolder(folder.path)}
                className={`quick-nav-item ${currentFolder === folder.path ? 'active' : ''}`}
                title={folder.path}
              >
                📁 {folder.path}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-btn"
                title="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="modal-error">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateFolder} className="modal-form">
              <div className="form-group">
                <label htmlFor="folderName">Folder Name</label>
                <input
                  type="text"
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  required
                  autoFocus
                  pattern="[a-zA-Z0-9-_]+"
                  title="Only letters, numbers, hyphens, and underscores are allowed"
                />
                <small className="location-hint">
                  📍 Will be created in: {currentFolder === 'root' || !currentFolder ? '/' : `/${currentFolder}/`}
                  <strong>{newFolderName || '...'}</strong>
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cancel-btn"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={creating || !newFolderName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderManager;