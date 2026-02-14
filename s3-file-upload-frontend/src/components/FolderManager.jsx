// frontend/src/components/FolderManager.jsx
import React, { useState } from 'react';
import { createFolder, deleteFolder } from '../services/uploadService';
import '../styles/FolderManager.css';

const FolderManager = ({ currentFolder, onFolderChange, folders, onFolderCreated, onFolderDeleted }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const folderPath = currentFolder && currentFolder !== 'root'
        ? `${currentFolder}/${newFolderName}`
        : newFolderName;

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

  const handleDeleteFolder = async (folderPath) => {
    if (!window.confirm(`Are you sure you want to delete the folder "${folderPath}" and all its contents?`)) {
      return;
    }

    try {
      await deleteFolder(folderPath);
      if (onFolderDeleted) {
        onFolderDeleted();
      }
    } catch (err) {
      alert(`Failed to delete folder: ${err.message}`);
    }
  };

  const navigateToFolder = (folderName) => {
    if (onFolderChange) {
      const newPath = currentFolder && currentFolder !== 'root'
        ? `${currentFolder}/${folderName}`
        : folderName;
      onFolderChange(newPath);
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

  return (
    <div className="folder-manager">
      <div className="folder-header">
        <div className="breadcrumb">
          <button onClick={goToRoot} className="breadcrumb-item">
            🏠 Home
          </button>
          {currentFolder && currentFolder !== 'root' && (
            <>
              {currentFolder.split('/').map((folder, index, arr) => (
                <React.Fragment key={index}>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-item current">
                    📁 {folder}
                  </span>
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        <div className="folder-actions">
          {currentFolder && currentFolder !== 'root' && (
            <button onClick={navigateUp} className="action-btn-small">
              ⬆️ Up
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="create-folder-btn"
          >
            ➕ New Folder
          </button>
        </div>
      </div>

      {folders && folders.length > 0 && (
        <div className="folders-list">
          {folders.map((folder) => (
            <div key={folder.path} className="folder-item">
              <button
                onClick={() => navigateToFolder(folder.name)}
                className="folder-name"
              >
                📁 {folder.name}
              </button>
              <button
                onClick={() => handleDeleteFolder(folder.path)}
                className="delete-folder-btn"
                title="Delete folder"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-btn"
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
                <small>
                  Current location: {currentFolder === 'root' ? 'Root' : currentFolder}
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
                  disabled={creating}
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