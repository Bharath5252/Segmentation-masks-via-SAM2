#!/bin/bash

# SAM2 Building Segmentation App - Quick Start Script

echo "🚀 Starting SAM2 Building Segmentation App..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found in backend directory."
    echo "📝 Creating .env file from template..."
    cp backend/env.example backend/.env
    echo "🔧 Please edit backend/.env and add your Modal credentials:"
    echo "   - MODAL_TOKEN_ID"
    echo "   - MODAL_TOKEN_SECRET"
    echo ""
    echo "📖 Get your Modal credentials from: https://modal.com"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if Modal credentials are set
if grep -q "your_modal_token_id_here" backend/.env; then
    echo "❌ Please update your Modal credentials in backend/.env"
    echo "📖 Get your Modal credentials from: https://modal.com"
    exit 1
fi

echo "🔧 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📖 Usage instructions:"
    echo "   1. Open http://localhost:5173 in your browser"
    echo "   2. Upload an image of an Indian building"
    echo "   3. Click 'Generate Masks' to create segmentation masks"
    echo "   4. Click on the image to select masks"
    echo "   5. Choose colors and apply them to selected areas"
    echo "   6. Download your colored building image"
    echo ""
    echo "🛑 To stop the services, run: docker-compose down"
else
    echo "❌ Failed to start services. Check the logs with: docker-compose logs"
    exit 1
fi 