// frontend/src/App.jsx
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadMethod, setUploadMethod] = useState('direct');

  const handleUploadSuccess = (uploadedFiles) => {
    console.log('Files uploaded successfully:', uploadedFiles);
    // Trigger refresh of file list
    setRefreshTrigger((prev) => prev + 1);
    
    // Show success notification
    alert(`Successfully uploaded ${uploadedFiles.length} file(s)!`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📦 S3 File Upload System</h1>
        <p>Upload files to AWS S3 with React + Node.js</p>
      </header>

      <main className="app-main">
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
          />
        </div>

        <div className="list-section">
          <FileList refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, Node.js, Express & AWS S3</p>
      </footer>
    </div>
  );
}

export default App;