# AWS S3 CORS Configuration

## Step 1: Create S3 Bucket

1. Go to AWS S3 Console: https://console.aws.amazon.com/s3/
2. Click "Create bucket"
3. Enter a unique bucket name (e.g., `my-file-upload-bucket`)
4. Select your region (e.g., `us-east-1`)
5. Uncheck "Block all public access" if you want public uploads (optional)
6. Click "Create bucket"

## Step 2: Configure CORS

1. Go to your bucket → Permissions tab
2. Scroll down to "Cross-origin resource sharing (CORS)"
3. Click "Edit" and paste the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

4. Click "Save changes"

**For Production:** Update `AllowedOrigins` to include your production domain:
```json
"AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

## Step 3: Create IAM User

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Add users"
3. Enter username (e.g., `s3-upload-user`)
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"

## Step 4: Attach S3 Policy

### Option A: Use Managed Policy (Full Access)
1. Click "Attach existing policies directly"
2. Search for `AmazonS3FullAccess`
3. Check the box and click "Next"

### Option B: Create Custom Policy (Recommended)
1. Click "Create policy"
2. Select JSON tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObjectAcl",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR_BUCKET_NAME/*",
                "arn:aws:s3:::YOUR_BUCKET_NAME"
            ]
        }
    ]
}
```

3. Replace `YOUR_BUCKET_NAME` with your actual bucket name
4. Click "Review policy"
5. Name it (e.g., `S3UploadPolicy`)
6. Click "Create policy"
7. Go back to user creation and attach this policy

## Step 5: Get Access Keys

1. After creating user, you'll see:
   - Access key ID
   - Secret access key
2. **IMPORTANT**: Copy these immediately and store securely
3. You won't be able to see the secret key again
4. Add these to your backend `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

## Step 6: Bucket Policy (Optional - For Public Files)

If you want to make uploaded files publicly accessible, add this bucket policy:

1. Go to bucket → Permissions → Bucket policy
2. Click "Edit" and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

3. Replace `YOUR_BUCKET_NAME` with your bucket name
4. Click "Save changes"

**Note**: This makes ALL files publicly readable. For selective public access, use ACL in the upload request instead.

## Verification

Test your configuration:
1. Start your backend server
2. Start your frontend application
3. Try uploading a file
4. Check the S3 console to verify the file was uploaded

## Troubleshooting

### CORS Errors
- Verify CORS configuration includes your frontend origin
- Make sure both HTTP and HTTPS are included if needed
- Check browser console for specific CORS error messages

### Access Denied Errors
- Verify IAM user has correct permissions
- Check bucket policy if using one
- Ensure AWS credentials are correct in `.env`

### Upload Fails
- Check file size limits
- Verify bucket name is correct
- Ensure region matches in configuration
- Check CloudWatch logs for detailed errors

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate access keys** regularly
4. **Use least privilege principle** - grant only necessary permissions
5. **Enable S3 versioning** for file recovery
6. **Set up CloudWatch alarms** for unusual activity
7. **Use HTTPS only** in production
8. **Implement rate limiting** on your backend
9. **Validate file types and sizes** on both client and server
10. **Consider using S3 Object Lock** for sensitive files