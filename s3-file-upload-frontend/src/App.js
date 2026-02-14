// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
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
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const auth = isAuthenticated();
    const storedUser = getStoredUser();
    
    if (auth && storedUser) {
      setAuthenticated(true);
      setUser(storedUser);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchFilesAndFolders();
    }
  }, [authenticated, currentFolder, refreshTrigger]);

  const fetchFilesAndFolders = async () => {
    setLoading(true);
    try {
      const folderPath = currentFolder === 'root' ? '' : currentFolder;
      const response = await listFiles(folderPath);
      setFolders(response.data.folders || []);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setUser(null);
    setCurrentFolder('root');
    setFolders([]);
    setFiles([]);
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
            <p>Secure file storage with AWS S3</p>
          </div>
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">👤 {user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
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
            onFolderCreated={handleFolderCreated}
            onFolderDeleted={handleFolderDeleted}
          />

          <div className="content-grid">
            <div className="upload-section">
              <div className="section-header">
                <h2>Upload Files</h2>
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
              />
            </div>

            <div className="list-section">
              <FileList
                refreshTrigger={refreshTrigger}
                currentFolder={currentFolder}
                files={files}
                loading={loading}
                onFileDeleted={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, Node.js, Express & AWS S3 | Authenticated as {user?.email}</p>
      </footer>
    </div>
  );
}

export default App;