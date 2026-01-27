# API Documentation

Complete API reference for the S3 File Upload System backend.

## Base URL

```
http://localhost:5000/api/files
```

## Authentication

Currently, the API does not require authentication. For production, implement JWT or API key authentication.

---

## Endpoints

### 1. Upload Single File

Upload a file directly through the server to S3.

**Endpoint:** `POST /api/files/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | The file to upload |
| isPublic | boolean | No | Make file publicly accessible (default: false) |

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('isPublic', 'true');

const response = await fetch('http://localhost:5000/api/files/upload', {
  method: 'POST',
  body: formData,
});
```

**Example Request (curl):**
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -F "file=@/path/to/file.pdf" \
  -F "isPublic=true"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "fileName": "document.pdf",
    "fileKey": "uploads/1706345678901-a1b2c3d4-e5f6.pdf",
    "fileUrl": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/1706345678901-a1b2c3d4-e5f6.pdf",
    "publicUrl": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/1706345678901-a1b2c3d4-e5f6.pdf",
    "size": 1024000,
    "contentType": "application/pdf"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "No file provided"
}
```

---

### 2. Upload Multiple Files

Upload multiple files in a single request.

**Endpoint:** `POST /api/files/upload-multiple`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| files | File[] | Yes | Array of files (max 10) |
| isPublic | boolean | No | Make files publicly accessible (default: false) |

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('files', file);
});
formData.append('isPublic', 'false');

const response = await fetch('http://localhost:5000/api/files/upload-multiple', {
  method: 'POST',
  body: formData,
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "fileName": "document1.pdf",
        "fileKey": "uploads/1706345678901-a1b2c3d4.pdf",
        "fileUrl": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/...",
        "size": 1024000,
        "contentType": "application/pdf"
      },
      {
        "fileName": "image.jpg",
        "fileKey": "uploads/1706345678902-e5f6g7h8.jpg",
        "fileUrl": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/...",
        "size": 512000,
        "contentType": "image/jpeg"
      }
    ],
    "count": 2
  }
}
```

---

### 3. Generate Pre-signed URL

Get a pre-signed URL for client-side direct upload to S3.

**Endpoint:** `POST /api/files/presigned-url`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "isPublic": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fileName | string | Yes | Original file name |
| fileType | string | Yes | MIME type of the file |
| isPublic | boolean | No | Make file publicly accessible (default: false) |

**Example Request (JavaScript):**
```javascript
const response = await fetch('http://localhost:5000/api/files/presigned-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: 'document.pdf',
    fileType: 'application/pdf',
    isPublic: false,
  }),
});

const { uploadUrl, fileKey } = await response.json();

// Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: fileObject,
  headers: {
    'Content-Type': 'application/pdf',
  },
});
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://bucket-name.s3.amazonaws.com/uploads/1706345678901-a1b2c3d4.pdf?X-Amz-Algorithm=...",
    "fileKey": "uploads/1706345678901-a1b2c3d4.pdf",
    "fileUrl": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/1706345678901-a1b2c3d4.pdf"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "fileName and fileType are required"
}
```

---

### 4. Get Private File URL

Generate a temporary signed URL to access a private file.

**Endpoint:** `GET /api/files/url/:fileKey`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fileKey | string | Yes | The S3 object key |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| duration | number | No | 3600 | URL expiration time in seconds |

**Example Request:**
```
GET /api/files/url/uploads/1706345678901-a1b2c3d4.pdf?duration=7200
```

**Example Request (JavaScript):**
```javascript
const fileKey = 'uploads/1706345678901-a1b2c3d4.pdf';
const duration = 7200; // 2 hours

const response = await fetch(
  `http://localhost:5000/api/files/url/${fileKey}?duration=${duration}`
);
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://bucket-name.s3.amazonaws.com/uploads/1706345678901-a1b2c3d4.pdf?X-Amz-Algorithm=...",
    "expiresIn": 7200
  }
}
```

---

### 5. Delete File

Delete a file from S3.

**Endpoint:** `DELETE /api/files/:fileKey`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fileKey | string | Yes | The S3 object key to delete |

**Example Request:**
```
DELETE /api/files/uploads/1706345678901-a1b2c3d4.pdf
```

**Example Request (JavaScript):**
```javascript
const fileKey = 'uploads/1706345678901-a1b2c3d4.pdf';

const response = await fetch(
  `http://localhost:5000/api/files/${fileKey}`,
  {
    method: 'DELETE',
  }
);
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "fileKey is required"
}
```

---

### 6. List Files

List all files in the S3 bucket.

**Endpoint:** `GET /api/files`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| prefix | string | No | "uploads/" | Filter files by prefix |
| maxKeys | number | No | 100 | Maximum number of files to return |

**Example Request:**
```
GET /api/files?prefix=uploads/&maxKeys=50
```

**Example Request (JavaScript):**
```javascript
const response = await fetch(
  'http://localhost:5000/api/files?prefix=uploads/&maxKeys=50'
);
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "key": "uploads/1706345678901-a1b2c3d4.pdf",
        "size": 1024000,
        "lastModified": "2024-01-27T10:00:00.000Z",
        "url": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/1706345678901-a1b2c3d4.pdf"
      },
      {
        "key": "uploads/1706345678902-e5f6g7h8.jpg",
        "size": 512000,
        "lastModified": "2024-01-27T11:00:00.000Z",
        "url": "https://bucket-name.s3.us-east-1.amazonaws.com/uploads/1706345678902-e5f6g7h8.jpg"
      }
    ],
    "count": 2
  }
}
```

---

### 7. Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Example Request:**
```
GET http://localhost:5000/health
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error (development only)"
}
```

---

## File Upload Limits

| Limit | Value | Configurable Via |
|-------|-------|------------------|
| Max file size | 10 MB | `MAX_FILE_SIZE` env variable |
| Max files per request | 10 | Hardcoded in middleware |
| Allowed file types | Images, PDFs, Text | `ALLOWED_FILE_TYPES` env variable |

---

## Allowed File Types

Default allowed MIME types:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`
- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `text/plain`
- `text/csv`

Configure via `ALLOWED_FILE_TYPES` environment variable.

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production using packages like:
- `express-rate-limit`
- `express-slow-down`

---

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React dev server)
- Configure additional origins via `CORS_ORIGIN` environment variable

For multiple origins in production:
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true,
}));
```

---

## Best Practices

### 1. File Naming
- Files are automatically renamed with timestamps and UUIDs
- Original names are preserved in response
- Format: `{timestamp}-{uuid}{extension}`

### 2. Public vs Private Files
- **Private files**: Require signed URLs to access (expires)
- **Public files**: Directly accessible via URL (no expiration)
- Choose based on your security requirements

### 3. Pre-signed URLs vs Direct Upload
- **Pre-signed URL**: Better for large files, reduces server load
- **Direct upload**: Better for small files, easier error handling

### 4. Error Handling
Always check `success` field in response:
```javascript
const response = await uploadFile(file);
if (response.success) {
  console.log('Upload successful:', response.data);
} else {
  console.error('Upload failed:', response.message);
}
```

---

## Testing with Postman

### Upload File
1. Method: POST
2. URL: `http://localhost:5000/api/files/upload`
3. Body → form-data:
   - Key: `file`, Type: File, Value: [Select file]
   - Key: `isPublic`, Type: Text, Value: `true`

### Get Pre-signed URL
1. Method: POST
2. URL: `http://localhost:5000/api/files/presigned-url`
3. Body → raw → JSON:
```json
{
  "fileName": "test.pdf",
  "fileType": "application/pdf"
}
```

---

## Security Considerations

1. **Authentication**: Add JWT or API keys for production
2. **Input Validation**: Always validate file types and sizes
3. **Rate Limiting**: Implement to prevent abuse
4. **Sanitization**: File names are sanitized automatically
5. **HTTPS**: Use HTTPS in production
6. **Environment Variables**: Never commit sensitive data
7. **IAM Permissions**: Use least privilege principle

---

## Common Issues

### Issue: "Access Denied" Error
**Solution**: Check IAM user permissions and bucket policy

### Issue: CORS Error
**Solution**: Verify CORS configuration in S3 and backend

### Issue: "File too large"
**Solution**: Increase `MAX_FILE_SIZE` or reduce file size

### Issue: Pre-signed URL expired
**Solution**: URLs expire after 15 minutes by default; generate new URL

---

## Additional Resources

- [AWS S3 API Documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)
- [Express.js Documentation](https://expressjs.com/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)