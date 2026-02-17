# 📦 S3 File Manager

A full-stack secure cloud file storage system built with React, Node.js, Express, MongoDB, and AWS S3. Upload, organise, and manage files in virtual folders — all behind JWT authentication.

---

## 🎯 Problem Solved

Managing files directly in an S3 bucket is painful — no user accounts, no folder organisation, no access control, and no friendly interface. This project wraps S3 with a proper web application that gives every user their own private workspace with full folder management.

| Pain Point | How It's Solved |
|---|---|
| Anyone can access files | JWT authentication — every request is verified |
| No folder structure in S3 | Virtual folders using S3 key prefixes + MongoDB tracking |
| Files lost between sessions | MongoDB persists all file metadata permanently |
| No rename on upload | Files can be renamed before uploading |
| Navigating S3 is clunky | React UI with breadcrumb navigation and back button |
| Hard to delete files | One-click delete removes from both S3 and MongoDB |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │  Login   │  │ Folder   │  │   File Upload &   │ │
│  │  Page    │  │ Manager  │  │    File List      │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
│              React Frontend (port 3000)              │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / REST API
                         │ Bearer Token (JWT)
┌────────────────────────▼────────────────────────────┐
│             Node.js / Express Backend (port 5000)    │
│                                                      │
│  ┌──────────────┐   ┌────────────────────────────┐  │
│  │  Auth Routes │   │       File Routes           │  │
│  │  /api/auth   │   │       /api/files            │  │
│  └──────┬───────┘   └────────────┬───────────────┘  │
│         │                        │                   │
│  ┌──────▼───────────────────────▼───────────────┐   │
│  │              Middleware                        │   │
│  │  • JWT Auth Check   • Multer File Parser      │   │
│  └──────┬───────────────────────┬───────────────┘   │
│         │                       │                    │
└─────────┼───────────────────────┼────────────────────┘
          │                       │
┌─────────▼──────┐    ┌──────────▼──────────────────┐
│    MongoDB      │    │          AWS S3              │
│                 │    │                              │
│  users {}       │    │  bucket/                     │
│  files  {}      │    │  └── users/                  │
│                 │    │      └── {userId}/           │
│  Stores:        │    │          ├── file.pdf        │
│  • User accounts│    │          └── documents/      │
│  • File metadata│    │              └── report.docx │
│  • Folder paths │    │                              │
└─────────────────┘    └──────────────────────────────┘
```

### How Folders Work

S3 has no real concept of folders — everything is a flat key. This app simulates folders using key prefixes and a `.foldermarker` file so that empty folders still appear in the UI.

```
S3 Key:    users/abc123/documents/report.pdf
           └──────────┘└─────────┘└─────────┘
            user scope   folder    filename
```

MongoDB tracks every file with its folder path, making listing fast without querying S3 directly.

---

## ✨ Features

- 🔐 **User Authentication** — Register, login, JWT tokens, role-based access (admin / user)
- 📁 **Folder Management** — Create, navigate, and delete folders
- ⬆️ **File Upload** — Drag & drop, multi-file, choose destination folder, rename before upload
- ⬇️ **File Access** — View, download via pre-signed S3 URLs
- 🗑️ **File Deletion** — Removes from both S3 and MongoDB atomically
- 🧭 **Navigation** — Breadcrumb path, back button, quick-jump panel
- 👑 **Admin Panel** — Admins can access all users' files
- 📊 **Storage Stats** — File count and folder count shown in footer

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, CSS3 |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| File Storage | AWS S3 (SDK v3) |
| Auth | JWT + bcrypt |
| File Handling | Multer |

---

## 🚀 How to Run

### Prerequisites

- Node.js v18+
- MongoDB running locally **or** a MongoDB Atlas connection string
- An AWS account with an S3 bucket and IAM credentials

---

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd s3-file-upload-system

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

---

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/s3-file-upload

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

JWT_SECRET=your_long_random_secret_key_here
JWT_EXPIRATION=24h

MAX_FILE_SIZE=10485760
SIGNED_URL_EXPIRATION=3600
```

**Frontend** — create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

### 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

### 4. Create Admin User

```bash
cd backend
npm run seed:admin
# Creates: admin@example.com / admin123
```

---

### 5. Run the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# ✅ MongoDB Connected | 🚀 Server running on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

---

## 📂 Project Structure

```
s3-file-upload-system/
├── backend/
│   ├── src/
│   │   ├── config/        # MongoDB + S3 setup
│   │   ├── models/        # User & File schemas
│   │   ├── controllers/   # Auth & file logic
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # JWT + Multer
│   │   └── server.js
│   ├── scripts/
│   │   └── createAdmin.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/    # Login, FileUpload, FileList, FolderManager
    │   ├── services/      # API call helpers
    │   ├── styles/        # Per-component CSS
    │   └── App.js
    └── package.json
```

---

## 🔑 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/files/folders` | ✅ | Create folder |
| DELETE | `/api/files/folders/:folder` | ✅ | Delete folder + contents |
| POST | `/api/files/upload` | ✅ | Upload file |
| GET | `/api/files` | ✅ | List files & folders |
| GET | `/api/files/url/:fileKey` | ✅ | Pre-signed download URL |
| DELETE | `/api/files/:fileKey` | ✅ | Delete file |

---

## ⚠️ Before Going to Production

- Change the default admin password immediately
- Use a strong random `JWT_SECRET` (32+ characters)
- Restrict MongoDB Atlas network access to your server IP
- Set `NODE_ENV=production`
- Enable HTTPS on your domain