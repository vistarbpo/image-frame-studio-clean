@echo off
echo Building the application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo Build failed!
  exit /b %ERRORLEVEL%
)
echo Build completed successfully!

echo Creating deployment package...
if exist frame360-deploy.zip del frame360-deploy.zip
powershell Compress-Archive -Path dist\* -DestinationPath frame360-deploy.zip -Force
if %ERRORLEVEL% NEQ 0 (
  echo Failed to create deployment package!
  exit /b %ERRORLEVEL%
)
echo Deployment package created: frame360-deploy.zip

echo.
echo ==================================================
echo Deployment package created successfully!
echo ==================================================
echo.
echo Next steps:
echo 1. Log in to your Hostinger control panel
echo 2. Navigate to the File Manager
echo 3. Upload the frame360-deploy.zip file to your public_html directory
echo 4. Extract the zip file
echo 5. Make sure the .htaccess file is present and correctly configured
echo 6. Test your application by visiting your domain
echo.
echo For detailed instructions, please refer to the DEPLOYMENT.md file.
echo.
pause 