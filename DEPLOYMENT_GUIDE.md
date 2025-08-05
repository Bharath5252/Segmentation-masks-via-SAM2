# SAM2 Building Segmentation App - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Full Stack)

Railway is perfect for this application as it supports both Python backend and static frontend hosting.

#### Prerequisites
1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Modal Account**: Sign up at [modal.com](https://modal.com) for GPU inference
3. **GitHub Account**: For repository hosting

#### Deployment Steps

1. **Fork/Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd sam2-building-app
   ```

2. **Set up Modal Credentials**
   - Go to [modal.com](https://modal.com) and create an account
   - Get your API credentials from the dashboard
   - Note down your `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`

3. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway.cli
   
   # Login to Railway
   railway login
   
   # Deploy using the script
   ./deploy-railway.sh
   ```

4. **Configure Environment Variables**
   - Go to your Railway project dashboard
   - Add the following environment variables:
     ```
     MODAL_TOKEN_ID=your_modal_token_id
     MODAL_TOKEN_SECRET=your_modal_token_secret
     CORS_ORIGINS=https://your-frontend-domain.railway.app
     ```

5. **Access Your Application**
   - Frontend: `https://your-project-name.railway.app`
   - Backend API: `https://your-backend-service.railway.app`
   - API Docs: `https://your-backend-service.railway.app/docs`

### Option 2: Vercel + Railway (Separate Services)

#### Frontend on Vercel

1. **Deploy Frontend to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy frontend
   cd frontend
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Set `VITE_API_BASE_URL` to your Railway backend URL

#### Backend on Railway

1. **Deploy Backend to Railway**
   ```bash
   cd backend
   railway up
   ```

2. **Configure Environment Variables**
   - Set Modal credentials and CORS origins

### Option 3: Docker Deployment

#### Local Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

#### Cloud Docker Deployment

1. **AWS ECS**
   ```bash
   # Build and push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   docker build -t sam2-backend ./backend
   docker tag sam2-backend:latest $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sam2-backend:latest
   docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sam2-backend:latest
   ```

2. **Google Cloud Run**
   ```bash
   # Deploy to Cloud Run
   gcloud run deploy sam2-backend --source ./backend --platform managed --region us-central1 --allow-unauthenticated
   ```

## 🔧 Environment Configuration

### Required Environment Variables

#### Backend (.env)
```env
# Modal Configuration (Required)
MODAL_TOKEN_ID=your_modal_token_id
MODAL_TOKEN_SECRET=your_modal_token_secret

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Optional: Logging
LOG_LEVEL=INFO
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=https://your-backend-url.com
```

## 📊 Performance Optimization

### Backend Optimization
1. **Caching**: Implement Redis for mask caching
2. **Image Compression**: Add image compression before processing
3. **CDN**: Use CloudFront or similar for static assets

### Frontend Optimization
1. **Bundle Optimization**: Enable code splitting
2. **Image Optimization**: Implement lazy loading
3. **Caching**: Add service worker for offline support

## 🔒 Security Considerations

### Production Security
1. **HTTPS**: Ensure all traffic uses HTTPS
2. **Rate Limiting**: Implement API rate limiting
3. **Input Validation**: Validate all user inputs
4. **File Upload Security**: Limit file types and sizes

### Environment Security
1. **Secrets Management**: Use secure secret management
2. **Environment Variables**: Never commit secrets to version control
3. **Access Control**: Implement proper access controls

## 🧪 Testing Deployment

### Health Checks
```bash
# Test backend health
curl https://your-backend-url.com/health

# Test API documentation
curl https://your-backend-url.com/docs

# Test frontend
curl https://your-frontend-url.com
```

### Functional Testing
1. **Upload Test Image**: Upload a building image
2. **Generate Masks**: Test mask generation
3. **Interactive Selection**: Test click and shift-click functionality
4. **Color Application**: Test color application
5. **Download**: Test image download

## 📈 Monitoring and Analytics

### Backend Monitoring
1. **Health Checks**: Monitor `/health` endpoint
2. **Error Tracking**: Implement error logging
3. **Performance Metrics**: Monitor response times
4. **Resource Usage**: Monitor CPU and memory usage

### Frontend Monitoring
1. **Error Tracking**: Implement Sentry or similar
2. **Performance Monitoring**: Monitor Core Web Vitals
3. **User Analytics**: Implement Google Analytics

## 💰 Cost Optimization

### Railway Costs
- **Backend**: ~$5-20/month depending on usage
- **Frontend**: Free tier available
- **Modal GPU**: ~$5-20/month depending on usage

### Cost Optimization Tips
1. **Auto-scaling**: Enable auto-scaling for variable loads
2. **Caching**: Implement caching to reduce API calls
3. **Image Optimization**: Compress images before processing
4. **Resource Limits**: Set appropriate resource limits

## 🚨 Troubleshooting

### Common Issues

1. **Modal Connection Issues**
   ```bash
   # Check Modal credentials
   echo $MODAL_TOKEN_ID
   echo $MODAL_TOKEN_SECRET
   
   # Test Modal connection
   curl -H "Authorization: Bearer $MODAL_TOKEN_SECRET" https://api.modal.com/v1/health
   ```

2. **CORS Issues**
   ```bash
   # Check CORS configuration
   curl -H "Origin: https://your-frontend-domain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS https://your-backend-url.com/upload-image
   ```

3. **Image Upload Issues**
   ```bash
   # Check file size limits
   # Check file type validation
   # Check disk space
   ```

### Debug Commands
```bash
# Check backend logs
railway logs --service backend

# Check frontend logs
railway logs --service frontend

# Test API endpoints
curl -X POST https://your-backend-url.com/upload-image \
     -F "file=@test-image.jpg"

# Monitor resource usage
railway status
```

## 📞 Support

### Getting Help
1. **Documentation**: Check the API docs at `/docs`
2. **GitHub Issues**: Report bugs on GitHub
3. **Community**: Join the Railway Discord community
4. **Modal Support**: Contact Modal support for GPU issues

### Useful Links
- [Railway Documentation](https://docs.railway.app)
- [Modal Documentation](https://modal.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Documentation](https://react.dev)

---

**Deployment Status**: ✅ Ready for Production
**Estimated Cost**: $10-40/month for moderate usage
**Recommended Platform**: Railway (Full Stack) 