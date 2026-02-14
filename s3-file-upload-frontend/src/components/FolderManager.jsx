// frontend/src/components/FolderManager.jsx
import React, { useState } from 'react';
import { createFolder, deleteFolder } from '../services/uploadService';
import '../styles/FolderManager.css';

const FolderManager = ({ 
  currentFolder, 
  onFolderChange, 
  folders = [], 
  allFolders = [], 
  onFolderCreated, 
  onFolderDeleted 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    
    if (!newFolderName || newFolderName.trim() === '') {
      setError('Folder name cannot be empty');
      return;
    }

    setError('');
    setCreating(true);

    try {
      // Sanitize folder name
      const sanitizedName = newFolderName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
      
      // Build folder path
      let folderPath = sanitizedName;
      if (currentFolder && currentFolder !== 'root') {
        folderPath = `${currentFolder}/${sanitizedName}`;
      }

      console.log('Creating folder:', folderPath);

      // Call API to create folder
      const response = await createFolder(folderPath);
      
      console.log('Folder created successfully:', response);
      
      // Close modal and reset
      setNewFolderName('');
      setShowCreateModal(false);
      
      // Trigger refresh
      if (onFolderCreated) {
        onFolderCreated();
      }
      
      // Show success message
      alert(`Folder "${sanitizedName}" created successfully!`);
      
    } catch (err) {
      console.error('Create folder error:', err);
      setError(err.message || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (folderPath, folderName) => {
    if (!window.confirm(`Are you sure you want to delete "${folderName}" and all its contents?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Deleting folder:', folderPath);
      await deleteFolder(folderPath);
      
      if (onFolderDeleted) {
        onFolderDeleted();
      }
      
      alert(`Folder "${folderName}" deleted successfully!`);
    } catch (err) {
      console.error('Delete folder error:', err);
      alert(`Failed to delete folder: ${err.message}`);
    }
  };

  const navigateToFolder = (folderPath) => {
    console.log('Navigating to:', folderPath);
    if (onFolderChange) {
      onFolderChange(folderPath);
    }
  };

  const navigateUp = () => {
    if (currentFolder && currentFolder !== 'root') {
      const parts = currentFolder.split('/');
      parts.pop();
      const newPath = parts.length > 0 ? parts.join('/') : 'root';
      navigateToFolder(newPath);
    }
  };

  const goToRoot = () => {
    navigateToFolder('root');
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
      navigateToFolder(parts.join('/'));
    }
  };

  return (
    <div className="folder-manager">
      <div className="folder-header">
        <div className="breadcrumb">
          <button 
            onClick={goToRoot} 
            className={`breadcrumb-item ${(!currentFolder || currentFolder === 'root') ? 'current' : ''}`}
            title="Go to root"
          >
            🏠 Home
          </button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="breadcrumb-separator">/</span>
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`breadcrumb-item ${index === breadcrumbParts.length - 1 ? 'current' : ''}`}
                title={`Go to ${part}`}
              >
                📁 {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="folder-actions">
          {currentFolder && currentFolder !== 'root' && (
            <button 
              onClick={navigateUp} 
              className="action-btn-small" 
              title="Go up one level"
            >
              ⬆️ Up
            </button>
          )}
          <button
            onClick={() => {
              setError('');
              setNewFolderName('');
              setShowCreateModal(true);
            }}
            className="create-folder-btn"
            title="Create new folder"
          >
            ➕ New Folder
          </button>
        </div>
      </div>

      {/* Current Location Indicator */}
      <div className="current-location">
        <span className="location-icon">📍</span>
        <span className="location-label">Current location:</span>
        <span className="location-path">
          {currentFolder === 'root' || !currentFolder ? '/ (root)' : `/${currentFolder}`}
        </span>
      </div>

      {/* Subfolders in current directory */}
      {folders && folders.length > 0 && (
        <div className="folders-section">
          <h3 className="section-subtitle">📂 Folders in this directory</h3>
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
        </div>
      )}

      {/* Quick Navigation - All Folders */}
      {allFolders && allFolders.length > 0 && (
        <div className="quick-navigation">
          <h3 className="section-subtitle">⚡ Quick Jump</h3>
          <div className="quick-nav-list">
            <button
              onClick={goToRoot}
              className={`quick-nav-item ${(!currentFolder || currentFolder === 'root') ? 'active' : ''}`}
              title="Go to root"
            >
              🏠 Root
            </button>
            {allFolders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => navigateToFolder(folder.path)}
                className={`quick-nav-item ${currentFolder === folder.path ? 'active' : ''}`}
                title={`Go to ${folder.path}`}
              >
                📁 {folder.path}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!folders || folders.length === 0) && (!allFolders || allFolders.length === 0) && (
        <div className="empty-folders">
          <div className="empty-icon">📂</div>
          <p className="empty-text">No folders yet</p>
          <p className="empty-hint">Create your first folder to organize files</p>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setError('');
          setNewFolderName('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📁 Create New Folder</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                  setNewFolderName('');
                }}
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
                  placeholder="e.g. documents, images, reports"
                  required
                  autoFocus
                  pattern="[a-zA-Z0-9-_]+"
                  title="Only letters, numbers, hyphens, and underscores are allowed"
                  disabled={creating}
                />
                <small className="input-hint">
                  ℹ️ Only letters, numbers, hyphens (-), and underscores (_) are allowed
                </small>
              </div>

              <div className="location-preview">
                <span className="preview-label">📍 Will be created at:</span>
                <div className="preview-path">
                  {currentFolder === 'root' || !currentFolder ? '/' : `/${currentFolder}/`}
                  <strong>{newFolderName || '...'}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setNewFolderName('');
                  }}
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
                  {creating ? (
                    <>
                      <span className="spinner-small"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      Create Folder
                    </>
                  )}
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