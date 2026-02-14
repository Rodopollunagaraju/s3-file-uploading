// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import FolderManager from './components/FolderManager';
import { logout, getStoredUser, isAuthenticated } from './services/authService';
import { listFiles } from './services/uploadService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadMethod, setUploadMethod] = useState('direct');
  const [currentFolder, setCurrentFolder] = useState('root');
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = isAuthenticated();
    const storedUser = getStoredUser();
    
    if (auth && storedUser) {
      setAuthenticated(true);
      setUser(storedUser);
    }
  }, []);

  const buildAllFolders = useCallback((filesData) => {
    const folderSet = new Set();
    
    filesData.forEach(file => {
      if (file.folder && file.folder !== 'root') {
        // Add all parent paths
        const parts = file.folder.split('/');
        for (let i = 0; i < parts.length; i++) {
          const path = parts.slice(0, i + 1).join('/');
          folderSet.add(path);
        }
      }
    });
    
    const uniqueFolders = Array.from(folderSet)
      .sort()
      .map(path => ({
        path,
        name: path.split('/').pop(),
      }));
    
    return uniqueFolders;
  }, []);

  const fetchFilesAndFolders = useCallback(async () => {
    if (!authenticated) return;
    
    setLoading(true);
    try {
      const folderPath = currentFolder === 'root' ? '' : currentFolder;
      const response = await listFiles(folderPath);
      
      setFolders(response.data.folders || []);
      setFiles(response.data.files || []);
      
      // Build complete folder list from all files
      const allFilesResponse = await listFiles('');
      const allFoldersList = buildAllFolders(allFilesResponse.data.files || []);
      setAllFolders(allFoldersList);
      
    } catch (error) {
      console.error('Failed to fetch files:', error);
      alert('Failed to load files: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [authenticated, currentFolder, buildAllFolders]);

  useEffect(() => {
    fetchFilesAndFolders();
  }, [fetchFilesAndFolders, refreshTrigger]);

  const handleLoginSuccess = () => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      setAuthenticated(false);
      setUser(null);
      setCurrentFolder('root');
      setFolders([]);
      setAllFolders([]);
      setFiles([]);
    }
  };

  const handleUploadSuccess = (uploadedFiles) => {
    console.log('Files uploaded successfully:', uploadedFiles);
    // Refresh file list
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderChange = (newFolder) => {
    console.log('Changing folder to:', newFolder);
    setCurrentFolder(newFolder);
  };

  const handleFolderCreated = () => {
    console.log('Folder created, refreshing...');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderDeleted = () => {
    console.log('Folder deleted, refreshing...');
    setRefreshTrigger((prev) => prev + 1);
    // Go back to root if we deleted the current folder
    setCurrentFolder('root');
  };

  const handleFileDeleted = () => {
    console.log('File deleted, refreshing...');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderClick = (folderPath) => {
    console.log('Navigating to folder:', folderPath);
    setCurrentFolder(folderPath);
  };

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">📦</span>
              <div className="logo-text">
                <h1>S3 File Manager</h1>
                <p className="tagline">Secure Cloud Storage</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-badge">
              <span className="user-avatar">
                {user?.role === 'admin' ? '👑' : '👤'}
              </span>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-button" title="Logout">
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {/* Folder Navigation */}
          <section className="navigation-section">
            <FolderManager
              currentFolder={currentFolder}
              onFolderChange={handleFolderChange}
              folders={folders}
              allFolders={allFolders}
              onFolderCreated={handleFolderCreated}
              onFolderDeleted={handleFolderDeleted}
            />
          </section>

          {/* Content Grid */}
          <div className="content-layout">
            {/* Left Side - Upload */}
            <section className="upload-section">
              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="section-icon">📤</span>
                    Upload Files
                  </h2>
                  <div className="upload-method-selector">
                    <button
                      className={`method-btn ${uploadMethod === 'direct' ? 'active' : ''}`}
                      onClick={() => setUploadMethod('direct')}
                    >
                      <span>⚡</span>
                      Direct
                    </button>
                    <button
                      className={`method-btn ${uploadMethod === 'presigned' ? 'active' : ''}`}
                      onClick={() => setUploadMethod('presigned')}
                    >
                      <span>🔗</span>
                      Pre-signed
                    </button>
                  </div>
                </div>
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  uploadMethod={uploadMethod}
                  currentFolder={currentFolder}
                  folders={allFolders}
                />
              </div>
            </section>

            {/* Right Side - File List */}
            <section className="list-section">
              <div className="section-card">
                <FileList
                  files={files}
                  folders={folders}
                  loading={loading}
                  onFileDeleted={handleFileDeleted}
                  onFolderClick={handleFolderClick}
                  currentFolder={currentFolder}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <p className="copyright">© 2024 S3 File Manager</p>
            <p className="tech-stack">React • Node.js • MongoDB • AWS S3</p>
          </div>
          <div className="footer-right">
            <div className="user-stats">
              <span className="stat-item">
                <span className="stat-label">User:</span>
                <span className="stat-value">{user?.email}</span>
              </span>
              <span className="stat-divider">•</span>
              <span className="stat-item">
                <span className="stat-label">Files:</span>
                <span className="stat-value">{files.length}</span>
              </span>
              <span className="stat-divider">•</span>
              <span className="stat-item">
                <span className="stat-label">Folders:</span>
                <span className="stat-value">{allFolders.length}</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;