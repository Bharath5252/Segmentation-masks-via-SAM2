# SAM2 Building Segmentation App - Demo Guide

## Quick Demo Setup

### Prerequisites
1. Docker and Docker Compose installed
2. Modal account with API credentials
3. Sample building images for testing

### Step 1: Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd sam2-building-app

# Copy environment template
cp backend/env.example backend/.env

# Edit backend/.env and add your Modal credentials
# MODAL_TOKEN_ID=your_modal_token_id
# MODAL_TOKEN_SECRET=your_modal_token_secret

# Start the application
./start.sh
```

### Step 2: Access the Application

Open your browser and navigate to: **http://localhost:5173**

## Demo Walkthrough

### 1. Upload an Image

1. **Prepare a test image**: Use an image of an Indian building (house, temple, commercial building, etc.)
2. **Upload the image**:
   - Drag and drop the image onto the upload area, OR
   - Click the upload area to select a file
3. **Verify upload**: You should see the image preview immediately

**Expected Result**: Image appears in the main view with upload confirmation message.

### 2. Generate Masks

1. **Click "Generate Masks"** button
2. **Wait for processing**: You'll see a loading spinner
3. **Check results**: Status message shows number of masks generated

**Expected Result**: 
- Loading indicator during processing (5-15 seconds)
- Success message: "Generated X masks"
- Button becomes disabled (masks already generated)

### 3. Interactive Mask Selection

1. **Click anywhere on the image**:
   - A yellow semi-transparent overlay appears over the selected area
   - This represents the mask for that specific point

2. **Combine masks** (Shift + Click):
   - Hold Shift and click on another area
   - Both masks are now selected (yellow overlay covers both areas)

3. **Remove masks** (Shift + Right-click):
   - Hold Shift and right-click on a selected area
   - That mask is removed from selection

4. **View all masks**:
   - Click "Show All Masks" button
   - All generated masks appear in different colors
   - Click "Hide All Masks" to return to selection mode

**Expected Result**: 
- Clicking shows yellow overlay on selected areas
- Shift+click adds more areas to selection
- Shift+right-click removes areas from selection
- "Show All Masks" displays colorful overlay of all masks

### 4. Color Application

1. **Select a color**:
   - Choose from the predefined color palette (12 colors), OR
   - Click "Custom Color" to open the color picker
   - Select your desired color

2. **Apply the color**:
   - Ensure you have masks selected (yellow overlay visible)
   - Click "Apply Color" button
   - The selected areas are colored with your chosen color

3. **Repeat for different areas**:
   - Select different masks (click on new areas)
   - Choose different colors
   - Apply colors to create a multi-colored building

**Expected Result**:
- Selected color appears in the color picker
- "Apply Color" button is enabled when masks are selected
- Colored areas appear with transparency over the original image
- Multiple colors can be applied to different areas

### 5. Download the Result

1. **Click "Download Image"** button
2. **Check your downloads folder**: File named `colored_building_[id].jpg`

**Expected Result**: 
- Download starts immediately
- File contains the original image with applied colors
- High-quality JPEG format

## Sample Test Images

### Good Test Images
- **Traditional Indian House**: Red brick walls, white trim
- **Temple Architecture**: Multiple colored sections
- **Modern Building**: Glass and concrete sections
- **Heritage Building**: Different colored facades

### Image Requirements
- **Format**: JPEG, PNG, or GIF
- **Size**: Up to 10MB
- **Resolution**: 1024x1024 or larger recommended
- **Content**: Clear building with distinct sections

## Troubleshooting Demo Issues

### Common Issues

1. **"Failed to upload image"**
   - Check file format (JPEG, PNG, GIF only)
   - Ensure file size < 10MB
   - Verify backend is running

2. **"Failed to generate masks"**
   - Check Modal credentials in backend/.env
   - Verify Modal account has credits
   - Check network connectivity

3. **"No masks appear when clicking"**
   - Ensure masks were generated first
   - Try clicking on different areas of the image
   - Check browser console for errors

4. **"Colors not applying"**
   - Ensure masks are selected (yellow overlay visible)
   - Check that "Apply Color" button is enabled
   - Verify color is selected from palette

### Debug Steps

1. **Check backend logs**:
   ```bash
   docker-compose logs backend
   ```

2. **Check frontend logs**:
   ```bash
   docker-compose logs frontend
   ```

3. **Verify Modal connection**:
   ```bash
   curl http://localhost:8000/health
   ```

4. **Test API directly**:
   ```bash
   curl http://localhost:8000/docs
   ```

## Performance Expectations

### Typical Timings
- **Image Upload**: < 1 second
- **Mask Generation**: 5-15 seconds (depends on image complexity)
- **Point Selection**: 1-3 seconds
- **Color Application**: < 1 second
- **Download**: Immediate

### Quality Expectations
- **Mask Accuracy**: 70-90% depending on image quality
- **Color Application**: Precise to mask boundaries
- **Output Quality**: High-resolution JPEG
- **User Experience**: Smooth, responsive interface

## Advanced Demo Features

### 1. Multiple Color Applications
- Apply different colors to different building sections
- Create realistic building color schemes
- Experiment with architectural color combinations

### 2. Mask Combination Techniques
- Use Shift+click to select large building sections
- Combine multiple small masks for complex areas
- Create precise selections for detailed coloring

### 3. All Masks Visualization
- Use "Show All Masks" to understand the segmentation
- Identify which areas correspond to which masks
- Plan your color strategy based on available masks

## Demo Success Criteria

A successful demo should demonstrate:

✅ **Complete Workflow**: Upload → Generate → Select → Color → Download

✅ **Interactive Features**: Click selection, mask combination, color application

✅ **Visual Feedback**: Clear overlays, status messages, loading indicators

✅ **Quality Output**: Downloadable colored image

✅ **User Experience**: Intuitive interface, responsive design

✅ **Error Handling**: Graceful handling of edge cases

## Next Steps After Demo

1. **Deploy to Production**: Follow DEPLOYMENT.md guide
2. **Customize Features**: Modify colors, add new functionality
3. **Scale Infrastructure**: Optimize for higher usage
4. **Add Authentication**: Implement user management
5. **Extend Functionality**: Add batch processing, custom models

---

**Demo Duration**: 10-15 minutes for complete workflow demonstration
**Technical Requirements**: Modern browser, stable internet connection
**Audience**: Technical and non-technical stakeholders 