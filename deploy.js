const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Update these with your Hostinger FTP details
  ftpHost: 'your-ftp-host.com',
  ftpUser: 'your-ftp-username',
  ftpPass: 'your-ftp-password',
  remoteDir: '/public_html', // or your specific directory
};

// Build the application
console.log('Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Create a zip file of the dist directory
console.log('Creating deployment package...');
const zipFileName = 'frame360-deploy.zip';
try {
  // Check if the zip file exists and remove it
  if (fs.existsSync(zipFileName)) {
    fs.unlinkSync(zipFileName);
  }
  
  // Create a zip file of the dist directory
  execSync(`powershell Compress-Archive -Path dist/* -DestinationPath ${zipFileName} -Force`, { stdio: 'inherit' });
  console.log(`Deployment package created: ${zipFileName}`);
} catch (error) {
  console.error('Failed to create deployment package:', error);
  process.exit(1);
}

console.log(`
==================================================
Deployment package created successfully!
==================================================

Next steps:
1. Log in to your Hostinger control panel
2. Navigate to the File Manager
3. Upload the ${zipFileName} file to your ${config.remoteDir} directory
4. Extract the zip file
5. Make sure the .htaccess file is present and correctly configured
6. Test your application by visiting your domain

For detailed instructions, please refer to the DEPLOYMENT.md file.
`); 