@echo off
echo Initializing Git repository...
git init
git add .
git commit -m "Initial commit - E-Payment Comparison Platform"
git branch -M main
git remote add origin https://github.com/bagheshwarbaba/Money_manager.git
echo Pushing to GitHub...
git push -u origin main
echo Done!
pause
