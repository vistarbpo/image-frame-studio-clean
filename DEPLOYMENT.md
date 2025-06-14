# Frame360 Deployment Guide for Hostinger

## Prerequisites
- A Hostinger account
- Your application built locally

## Step 1: Build Your Application
1. Open your terminal in the project directory
2. Run the build command:
   ```bash
   npm run build
   ```
3. This will create a `dist` folder with your production-ready files

## Step 2: Prepare Files for Upload
1. Create a `.htaccess` file in the `dist` folder with this content:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>

   # Enable CORS
   Header set Access-Control-Allow-Origin "*"

   # Cache Control
   <FilesMatch "\.(jpg|jpeg|png|gif|ico)$">
     Header set Cache-Control "max-age=31536000, public"
   </FilesMatch>
   <FilesMatch "\.(css|js)$">
     Header set Cache-Control "max-age=2592000, public"
   </FilesMatch>
   <FilesMatch "\.(html)$">
     Header set Cache-Control "max-age=86400, public"
   </FilesMatch>

   # Enable Compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/plain
     AddOutputFilterByType DEFLATE text/html
     AddOutputFilterByType DEFLATE text/xml
     AddOutputFilterByType DEFLATE text/css
     AddOutputFilterByType DEFLATE application/xml
     AddOutputFilterByType DEFLATE application/xhtml+xml
     AddOutputFilterByType DEFLATE application/rss+xml
     AddOutputFilterByType DEFLATE application/javascript
     AddOutputFilterByType DEFLATE application/x-javascript
   </IfModule>
   ```

## Step 3: Upload to Hostinger
1. Log in to your Hostinger control panel
2. Go to File Manager
3. Navigate to the `public_html` directory
4. Upload all files from your local `dist` folder to this directory
   - You can upload files individually or as a zip file
   - If uploading as zip, extract it after upload

## Step 4: Configure Domain (if needed)
1. In Hostinger control panel, go to "Domains"
2. Point your domain to the correct directory
3. Make sure SSL is enabled if you're using HTTPS

## Step 5: Test Your Application
1. Visit your domain in a web browser
2. Test all features:
   - Image upload
   - Frame selection
   - Download functionality
   - Authentication (if applicable)

## Troubleshooting
If you encounter issues:

1. **404 Errors**
   - Make sure the `.htaccess` file is uploaded correctly
   - Check if mod_rewrite is enabled on your hosting

2. **Missing Assets**
   - Verify all files are uploaded to the correct directory
   - Check file permissions (should be 644 for files, 755 for directories)

3. **CORS Issues**
   - Verify the `.htaccess` file includes the CORS headers
   - Check if mod_headers is enabled on your hosting

## Need Help?
- Contact Hostinger support for hosting-related issues
- Check the [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html) for more information 