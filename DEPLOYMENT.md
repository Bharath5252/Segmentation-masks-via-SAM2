# Deployment Guide

This guide covers deploying the SAM2 Building Segmentation and Coloring application to various cloud platforms.

## Prerequisites

1. **Modal Account**: Sign up at [modal.com](https://modal.com) for GPU-accelerated SAM2 inference
2. **Docker**: Install Docker and Docker Compose
3. **Git**: For version control

## Environment Setup

### 1. Modal Configuration

1. Create a Modal account and get your API credentials
2. Set up environment variables:

```bash
export MODAL_TOKEN_ID="your_modal_token_id"
export MODAL_TOKEN_SECRET="your_modal_token_secret"
```

### 2. Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd sam2-building-app
   ```

2. **Set up backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Set up frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### 3. Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## Cloud Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend Deployment on Vercel

1. **Connect your GitHub repository to Vercel**
2. **Configure build settings**:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

3. **Set environment variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   ```

#### Backend Deployment on Railway

1. **Connect your GitHub repository to Railway**
2. **Configure the service**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set environment variables**:
   ```
   MODAL_TOKEN_ID=your_modal_token_id
   MODAL_TOKEN_SECRET=your_modal_token_secret
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   ```

### Option 2: AWS Deployment

#### Using AWS ECS with Fargate

1. **Create ECR repositories**:
   ```bash
   aws ecr create-repository --repository-name sam2-backend
   aws ecr create-repository --repository-name sam2-frontend
   ```

2. **Build and push Docker images**:
   ```bash
   # Backend
   docker build -t sam2-backend ./backend
   docker tag sam2-backend:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/sam2-backend:latest
   docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/sam2-backend:latest

   # Frontend
   docker build -t sam2-frontend ./frontend
   docker tag sam2-frontend:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/sam2-frontend:latest
   docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/sam2-frontend:latest
   ```

3. **Create ECS cluster and services**:
   - Use the provided `aws-deployment.yml` CloudFormation template
   - Or create manually through AWS Console

#### Using AWS App Runner

1. **Deploy backend**:
   - Connect GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Set environment variables for Modal credentials

2. **Deploy frontend**:
   - Use Vercel or Netlify for frontend hosting
   - Set API base URL to your App Runner backend URL

### Option 3: Google Cloud Platform

#### Using Cloud Run

1. **Enable required APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

2. **Build and deploy backend**:
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/$PROJECT_ID/sam2-backend
   gcloud run deploy sam2-backend \
     --image gcr.io/$PROJECT_ID/sam2-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars MODAL_TOKEN_ID=$MODAL_TOKEN_ID,MODAL_TOKEN_SECRET=$MODAL_TOKEN_SECRET
   ```

3. **Deploy frontend**:
   ```bash
   cd frontend
   npm run build
   gcloud app deploy app.yaml
   ```

### Option 4: Azure

#### Using Azure Container Instances

1. **Build and push to Azure Container Registry**:
   ```bash
   az acr build --registry $ACR_NAME --image sam2-backend ./backend
   az acr build --registry $ACR_NAME --image sam2-frontend ./frontend
   ```

2. **Deploy containers**:
   ```bash
   az container create \
     --resource-group $RG_NAME \
     --name sam2-backend \
     --image $ACR_NAME.azurecr.io/sam2-backend:latest \
     --dns-name-label sam2-backend \
     --ports 8000 \
     --environment-variables MODAL_TOKEN_ID=$MODAL_TOKEN_ID MODAL_TOKEN_SECRET=$MODAL_TOKEN_SECRET
   ```

## Environment Variables

### Backend Environment Variables

```env
# Modal Configuration
MODAL_TOKEN_ID=your_modal_token_id
MODAL_TOKEN_SECRET=your_modal_token_secret

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Optional: Database Configuration (for production)
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Redis Configuration (for caching)
REDIS_URL=redis://localhost:6379
```

### Frontend Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Optional: Analytics
VITE_GA_TRACKING_ID=your_ga_tracking_id
```

## Monitoring and Logging

### Backend Monitoring

1. **Health Check Endpoint**: `GET /health`
2. **Logging**: Configure logging in `main.py`
3. **Metrics**: Add Prometheus metrics for production

### Frontend Monitoring

1. **Error Tracking**: Integrate Sentry for error monitoring
2. **Analytics**: Add Google Analytics or similar
3. **Performance**: Monitor Core Web Vitals

## Security Considerations

1. **API Security**:
   - Rate limiting
   - Input validation
   - CORS configuration
   - API key authentication (for production)

2. **File Upload Security**:
   - File type validation
   - File size limits
   - Virus scanning (optional)

3. **Environment Variables**:
   - Never commit secrets to version control
   - Use secure secret management services

## Troubleshooting

### Common Issues

1. **Modal Connection Issues**:
   - Verify Modal credentials
   - Check network connectivity
   - Ensure Modal account has sufficient credits

2. **CORS Errors**:
   - Verify CORS_ORIGINS configuration
   - Check frontend URL matches backend CORS settings

3. **Image Upload Issues**:
   - Check file size limits
   - Verify file format support
   - Check disk space on server

4. **Mask Generation Failures**:
   - Check Modal GPU availability
   - Verify SAM2 model loading
   - Check image format compatibility

### Debug Mode

Enable debug mode for development:

```bash
# Backend
export DEBUG=1
uvicorn main:app --reload --log-level debug

# Frontend
npm run dev -- --debug
```

## Performance Optimization

1. **Image Processing**:
   - Implement image compression
   - Add caching for generated masks
   - Use CDN for static assets

2. **API Optimization**:
   - Implement request caching
   - Add pagination for large datasets
   - Use async processing for long-running tasks

3. **Frontend Optimization**:
   - Implement lazy loading
   - Add service worker for caching
   - Optimize bundle size

## Cost Optimization

1. **Modal Usage**:
   - Monitor GPU usage
   - Implement request batching
   - Use appropriate model sizes

2. **Infrastructure**:
   - Use auto-scaling
   - Implement proper resource limits
   - Monitor usage patterns

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Open an issue on GitHub
4. Contact the development team 