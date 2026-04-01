#!/bin/bash

# Smart Voting System - Installation Script
# This script sets up the project and prepares it for development

echo "🗳️ Smart Voting System - Setup Script"
echo "======================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION found"
echo ""

# Check npm
echo "✓ Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm $NPM_VERSION found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "Starting: npm install"
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Create a Firebase project: https://console.firebase.google.com"
echo "2. Follow FIREBASE_SETUP.md for configuration"
echo "3. Create .env.local file with Firebase credentials"
echo "4. Run: npm run dev"
echo ""
echo "📚 For more help, see:"
echo "   - README.md (Project overview)"
echo "   - FIREBASE_SETUP.md (Firebase configuration)"
echo "   - DEVELOPMENT.md (Development guide)"
