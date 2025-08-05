#!/bin/bash

# SAM2 Building Segmentation App - Railway Deployment Script

echo "🚀 Deploying SAM2 Building Segmentation App to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Create new Railway project
echo "📦 Creating Railway project..."
PROJECT_NAME="sam2-building-app-$(date +%s)"
railway init --name "$PROJECT_NAME"

# Deploy backend
echo "🔧 Deploying backend..."
cd backend
railway up --service backend

# Get the backend URL
BACKEND_URL=$(railway domain --service backend)
echo "✅ Backend deployed at: $BACKEND_URL"

# Deploy frontend
echo "🎨 Deploying frontend..."
cd ../frontend

# Update API base URL for production
sed -i '' "s|http://localhost:8000|$BACKEND_URL|g" src/App.tsx

# Build frontend
npm run build

# Deploy to Railway
railway up --service frontend

# Get the frontend URL
FRONTEND_URL=$(railway domain --service frontend)
echo "✅ Frontend deployed at: $FRONTEND_URL"

echo ""
echo "🎉 Deployment Complete!"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend API: $BACKEND_URL"
echo "📚 API Documentation: $BACKEND_URL/docs"
echo ""
echo "📝 Next steps:"
echo "1. Set up Modal credentials in Railway environment variables"
echo "2. Test the application functionality"
echo "3. Share the frontend URL with users" 