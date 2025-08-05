#!/bin/bash

# SAM2 Credentials Setup Script
echo "🎯 SAM2 Credentials Setup Script"
echo "=================================="

# Check if Modal CLI is installed
if ! command -v modal &> /dev/null; then
    echo "📦 Installing Modal CLI..."
    pip install modal
else
    echo "✅ Modal CLI already installed"
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file..."
    cat > backend/.env << EOF
# Modal Credentials for SAM2
MODAL_TOKEN_ID=your_modal_token_id_here
MODAL_TOKEN_SECRET=your_modal_token_secret_here

# Optional: Other environment variables
DEBUG=true
LOG_LEVEL=info
EOF
    echo "✅ Created backend/.env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔐 Next Steps:"
echo "1. Run: modal token new"
echo "2. Follow the authentication flow in your browser"
echo "3. Edit backend/.env with your actual credentials"
echo "4. Restart the backend server"
echo ""
echo "📖 For detailed instructions, see: SAM2_SETUP_GUIDE.md"
echo ""
echo "🚀 Ready to set up SAM2 credentials!" 