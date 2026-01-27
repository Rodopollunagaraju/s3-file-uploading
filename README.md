# S3-Based File Upload System

A full-stack file upload system with React frontend and Node.js/Express backend, featuring AWS S3 integration for secure file storage with public/private URL generation.

## 🚀 Features

- ✅ Drag-and-drop file upload interface
- ✅ Multi-file upload support
- ✅ Real-time upload progress tracking
- ✅ S3 direct upload with pre-signed URLs
- ✅ Public and private URL generation
- ✅ File type validation
- ✅ Secure backend API with Express
- ✅ CORS configuration
- ✅ Error handling and retry logic

## 📁 Project Structure

```
s3-file-upload/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── s3Config.js
│   │   ├── controllers/
│   │   │   └── fileController.js
│   │   ├── routes/
│   │   │   └── fileRoutes.js
│   │   ├── middleware/
│   │   │   └── uploadMiddleware.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── FileList.jsx
│   │   │   └── UploadProgress.jsx
│   │   ├── services/
│   │   │   └── uploadService.js
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## 🛠️ Tech Stack

**Frontend:** React, Axios
**Backend:** Node.js, Express, AWS SDK v3
**Storage:** Amazon S3

## 📦 Installation

See individual setup files for detailed instructions.

## 🔐 AWS Setup

1. Create S3 bucket
2. Configure CORS policy
3. Create IAM user with S3 permissions
4. Generate access keys

## 📚 API Documentation

Full API documentation included in individual files.