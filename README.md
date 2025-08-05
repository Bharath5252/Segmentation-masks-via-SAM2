# SAM2 Building Segmentation & Coloring Application

A modern web application for interactive building segmentation and coloring using Meta's SAM2 (Segment Anything Model 2) with Modal GPU integration.

## 🏗️ Project Overview

This application allows users to:
- Upload images of buildings
- Generate accurate segmentation masks using SAM2
- Interactively select and color different building parts
- Download the final colored building images

## ✨ Features

- **Real-time SAM2 Integration**: Powered by Modal GPU for fast, accurate segmentation
- **Interactive Mask Selection**: Click on building parts to select them
- **Multi-color Application**: Apply different colors to various building elements
- **Responsive UI**: Modern, intuitive interface built with React and TypeScript
- **Real-time Preview**: See changes instantly as you apply colors
- **High-quality Output**: Download final images in high resolution

## 🚀 Live Demo

- **Frontend Application**: [http://localhost:5174/](http://localhost:5174/)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Dropzone** for file uploads
- **React Color** for color picker
- **Axios** for API communication
- **Lucide React** for icons

### Backend
- **FastAPI** with Python 3.13
- **Modal** for GPU-powered SAM2 inference
- **Pillow** for image processing
- **Uvicorn** for ASGI server
- **CORS** middleware for cross-origin requests

### AI/ML
- **SAM2 (Segment Anything Model 2)** by Meta
- **Modal GPU** for cloud inference
- **Automatic mask generation** for building segmentation

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.13+
- Modal account and credentials

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sam2-building-segmentation.git
cd sam2-building-segmentation
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```env
# Modal Credentials for SAM2
MODAL_TOKEN_ID=your_modal_token_id_here
MODAL_TOKEN_SECRET=your_modal_token_secret_here

# Optional: Other environment variables
DEBUG=true
LOG_LEVEL=info
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

### 5. Start the Application
```bash
# Terminal 1: Start Backend
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5174/
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎯 Usage Guide

### 1. Upload an Image
- Drag and drop or click to upload a building image
- Supported formats: JPG, PNG, GIF
- Maximum file size: 10MB

### 2. Generate Masks
- Click "Generate Masks" to create segmentation masks
- SAM2 will analyze the image and create masks for different building parts
- Processing time depends on image size and complexity

### 3. Select and Color Masks
- Click on any part of the building to select that mask
- Use the color palette or custom color picker to choose colors
- Click "Apply Color" to color the selected areas
- Use "Show All Masks" to see all generated masks

### 4. Download Result
- Click "Download Image" to save your colored building
- The final image will include all applied colors

## 🔧 API Endpoints

### Core Endpoints
- `POST /upload-image` - Upload building image
- `POST /generate-masks` - Generate SAM2 segmentation masks
- `POST /get-mask` - Get mask for specific point
- `POST /apply-colors` - Apply colors to selected masks
- `GET /download/{image_id}` - Download final colored image

### Utility Endpoints
- `GET /health` - Health check
- `GET /docs` - API documentation (Swagger UI)
- `GET /debug/masks/{image_id}` - Debug stored masks
- `GET /test/mock-mask` - Test mock mask generation

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Upload various building images
2. Test mask generation with different image types
3. Verify color application and download functionality
4. Check responsive design on different screen sizes

## 🚀 Deployment

### Backend Deployment (Railway)
```bash
# The backend is configured for Railway deployment
# See railway.json for configuration
railway up
```

### Frontend Deployment (Vercel)
```bash
# The frontend is configured for Vercel deployment
# See vercel.json for configuration
vercel --prod
```

## 📁 Project Structure

```
sam2-building-segmentation/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   ├── uploads/             # Uploaded images storage
│   └── tests/               # Backend tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   ├── App.css          # Styles
│   │   └── main.tsx         # React entry point
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite configuration
├── docker-compose.yml       # Docker setup
├── README.md               # This file
└── LICENSE                 # MIT License
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Meta AI** for SAM2 (Segment Anything Model 2)
- **Modal** for GPU infrastructure
- **FastAPI** for the excellent web framework
- **React** and **Vite** for the frontend framework

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the troubleshooting section below

## 🔧 Troubleshooting

### Common Issues

1. **Modal Token Errors**
   - Ensure your Modal credentials are correctly set in `.env`
   - Verify your Modal account has GPU access

2. **Upload Failures**
   - Check file size (max 10MB)
   - Verify file format (JPG, PNG, GIF)
   - Ensure backend is running on port 8000

3. **CORS Errors**
   - Verify frontend is running on allowed ports (5173, 5174)
   - Check CORS configuration in backend

4. **Mask Generation Issues**
   - Ensure Modal integration is working
   - Check GPU availability on Modal
   - Verify image quality and size

### Performance Tips

- Use images under 5MB for faster processing
- Close other GPU-intensive applications
- Ensure stable internet connection for Modal API calls 