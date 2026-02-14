// frontend/src/App.jsx
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

  const fetchFilesAndFolders = useCallback(async () => {
    if (!authenticated) return;
    
    setLoading(true);
    try {
      const folderPath = currentFolder === 'root' ? '' : currentFolder;
      const response = await listFiles(folderPath);
      
      setFolders(response.data.folders || []);
      setFiles(response.data.files || []);
      
      // Fetch all folders for quick navigation
      if (currentFolder === 'root' || currentFolder === '') {
        const allResponse = await listFiles('');
        
        // Build complete folder list
        const folderSet = new Set();
        const buildFolderTree = (items) => {
          items.forEach(item => {
            if (item.folder && item.folder !== 'root') {
              const parts = item.folder.split('/');
              for (let i = 0; i < parts.length; i++) {
                const path = parts.slice(0, i + 1).join('/');
                folderSet.add(path);
              }
            }
          });
        };
        
        buildFolderTree(allResponse.data.files || []);
        
        const uniqueFolders = Array.from(folderSet)
          .sort()
          .map(path => ({
            path,
            name: path.split('/').pop(),
          }));
        
        setAllFolders(uniqueFolders);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  }, [authenticated, currentFolder]);

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
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderChange = (newFolder) => {
    setCurrentFolder(newFolder);
  };

  const handleFolderCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
    // If we deleted the current folder, go to root
    setCurrentFolder('root');
  };

  const handleFileDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderClick = (folderPath) => {
    setCurrentFolder(folderPath);
  };

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📦 S3 File Upload System</h1>
            <p>Secure cloud file storage with MongoDB</p>
          </div>
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">👤 {user?.name}</span>
              <span className="user-role">{user?.role === 'admin' ? '👑 Admin' : '👥 User'}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <FolderManager
            currentFolder={currentFolder}
            onFolderChange={handleFolderChange}
            folders={folders}
            allFolders={allFolders}
            onFolderCreated={handleFolderCreated}
            onFolderDeleted={handleFolderDeleted}
          />

          <div className="content-grid">
            <div className="upload-section">
              <div className="section-header">
                <h2>📤 Upload Files</h2>
                <div className="upload-method-toggle">
                  <label>
                    <input
                      type="radio"
                      value="direct"
                      checked={uploadMethod === 'direct'}
                      onChange={(e) => setUploadMethod(e.target.value)}
                    />
                    Direct Upload
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="presigned"
                      checked={uploadMethod === 'presigned'}
                      onChange={(e) => setUploadMethod(e.target.value)}
                    />
                    Pre-signed URL
                  </label>
                </div>
              </div>
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                uploadMethod={uploadMethod}
                currentFolder={currentFolder}
                folders={allFolders}
              />
            </div>

            <div className="list-section">
              <FileList
                files={files}
                folders={folders}
                loading={loading}
                onFileDeleted={handleFileDeleted}
                onFolderClick={handleFolderClick}
                currentFolder={currentFolder}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built with React, Node.js, Express, MongoDB & AWS S3 | 
          {user?.email} ({user?.role})
        </p>
      </footer>
    </div>
  );
}

export default App;