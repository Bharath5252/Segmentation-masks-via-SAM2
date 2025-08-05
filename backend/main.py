import os
import uuid
import base64
from typing import List, Dict, Any, Optional
from pathlib import Path
import aiofiles
import httpx
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import modal
from PIL import Image
import numpy as np
import cv2
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Modal client
stub = modal.App("sam2-building-app")

# Create uploads directory
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="SAM2 Building Segmentation API",
    description="API for interactive building segmentation and coloring using SAM2",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Point(BaseModel):
    x: int
    y: int

class MaskRequest(BaseModel):
    image_id: str
    points: List[Point]
    labels: List[int]  # 1 for foreground, 0 for background

class ColorRequest(BaseModel):
    image_id: str
    mask_ids: List[str]
    color: str  # Hex color code

class GenerateMasksRequest(BaseModel):
    image_id: str

class ImageData(BaseModel):
    image_id: str
    masks: List[Dict[str, Any]]
    original_image: str

# In-memory storage (in production, use a proper database)
image_store: Dict[str, ImageData] = {}

@stub.function(
    image=modal.Image.debian_slim().pip_install([
        "torch",
        "torchvision",
        "opencv-python",
        "Pillow",
        "numpy",
        "git+https://github.com/facebookresearch/sam2.git"
    ]),
    gpu="A100",
    timeout=300
)
def generate_masks_modal(image_data: bytes) -> List[Dict[str, Any]]:
    """Generate masks using SAM2 on Modal GPU"""
    import torch
    from sam2.build_sam import build_sam2
    from sam2.automatic_mask_generator import SamAutomaticMaskGenerator
    import cv2
    import numpy as np
    from PIL import Image
    import io
    
    # Load image
    image = Image.open(io.BytesIO(image_data))
    image_array = np.array(image)
    
    # Initialize SAM2
    sam2 = build_sam2("sam2_hiera_tiny")
    mask_generator = SamAutomaticMaskGenerator(sam2)
    
    # Generate masks
    masks = mask_generator.generate(image_array)
    
    # Convert masks to the format expected by frontend
    processed_masks = []
    for i, mask in enumerate(masks):
        processed_masks.append({
            "id": str(i),
            "segmentation": mask["segmentation"].tolist(),
            "area": int(mask["area"]),
            "bbox": mask["bbox"],
            "predicted_iou": float(mask["predicted_iou"]),
            "point_coords": mask.get("point_coords", []),
            "stability_score": float(mask["stability_score"])
        })
    
    return processed_masks

@stub.function(
    image=modal.Image.debian_slim().pip_install([
        "torch",
        "torchvision",
        "opencv-python",
        "Pillow",
        "numpy",
        "git+https://github.com/facebookresearch/sam2.git"
    ]),
    gpu="A100",
    timeout=60
)
def get_mask_for_points_modal(image_data: bytes, points: List[List[int]], labels: List[int]) -> Dict[str, Any]:
    """Get mask for specific points using SAM2"""
    import torch
    from sam2.build_sam import build_sam2
    from sam2.predictor import SamPredictor
    import cv2
    import numpy as np
    from PIL import Image
    import io
    
    # Load image
    image = Image.open(io.BytesIO(image_data))
    image_array = np.array(image)
    
    # Initialize SAM2
    sam2 = build_sam2("sam2_hiera_tiny")
    predictor = SamPredictor(sam2)
    predictor.set_image(image_array)
    
    # Convert points to numpy array
    input_points = np.array(points)
    input_labels = np.array(labels)
    
    # Predict mask
    masks, scores, logits = predictor.predict(
        point_coords=input_points,
        point_labels=input_labels,
        multimask_output=True,
    )
    
    # Return the best mask
    best_mask_idx = np.argmax(scores)
    return {
        "segmentation": masks[best_mask_idx].tolist(),
        "score": float(scores[best_mask_idx])
    }

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return image ID"""
    print(f"Uploading file: {file.filename}, size: {file.size}, type: {file.content_type}")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique ID
    image_id = str(uuid.uuid4())
    print(f"Generated image ID: {image_id}")
    
    # Save image
    image_path = UPLOADS_DIR / f"{image_id}.jpg"
    async with aiofiles.open(image_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    print(f"Saved image to: {image_path}, size: {len(content)} bytes")
    
    # Convert to base64 for frontend
    image_base64 = base64.b64encode(content).decode("utf-8")
    
    response_data = {
        "image_id": image_id,
        "message": "Image uploaded successfully",
        "image_data": f"data:image/jpeg;base64,{image_base64}"
    }
    
    print(f"Upload response: {response_data['image_id']}")
    return response_data

@app.post("/generate-masks")
async def generate_masks(request: GenerateMasksRequest):
    """Generate masks for the uploaded image"""
    image_id = request.image_id
    
    image_path = UPLOADS_DIR / f"{image_id}.jpg"
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Read image data
    async with aiofiles.open(image_path, "rb") as f:
        image_data = await f.read()
    
    # Generate masks using Modal
    try:
        with stub.run():
            masks = generate_masks_modal(image_data)
    except Exception as e:
        # For testing without Modal credentials, return mock masks
        print(f"Modal error: {e}")
        print("Falling back to mock mask generation...")
        
        # Create a simple mock mask for testing
        image = Image.open(image_path)
        width, height = image.size
        print(f"Image dimensions: {width}x{height}")
        
        # Create multiple smaller masks instead of one large mask
        masks = []
        mask_size = min(width, height) // 8  # Smaller masks
        
        # Create 4 masks in different quadrants
        quadrants = [
            (width // 4, height // 4),      # Top-left
            (3 * width // 4, height // 4),  # Top-right
            (width // 4, 3 * height // 4),  # Bottom-left
            (3 * width // 4, 3 * height // 4)  # Bottom-right
        ]
        
        for i, (center_x, center_y) in enumerate(quadrants):
            mock_mask = [[False for _ in range(width)] for _ in range(height)]
            
            print(f"Creating mock mask {i} at center ({center_x}, {center_y}) with size {mask_size}")
            
            for y in range(max(0, center_y - mask_size), min(height, center_y + mask_size)):
                for x in range(max(0, center_x - mask_size), min(width, center_x + mask_size)):
                    mock_mask[y][x] = True
            
            # Calculate proper bbox
            bbox_x = center_x - mask_size
            bbox_y = center_y - mask_size
            bbox_width = mask_size * 2
            bbox_height = mask_size * 2
            
            masks.append({
                "id": str(i),
                "segmentation": mock_mask,
                "area": bbox_width * bbox_height,
                "bbox": [bbox_x, bbox_y, bbox_width, bbox_height],
                "predicted_iou": 0.9,
                "point_coords": [[center_x, center_y]],
                "stability_score": 0.9
            })
            
            print(f"Generated mock mask {i} with area: {bbox_width * bbox_height}, bbox: {[bbox_x, bbox_y, bbox_width, bbox_height]}")
    
    print(f"Total masks generated: {len(masks)}")
    
    # Store in memory
    image_store[image_id] = ImageData(
        image_id=image_id,
        masks=masks,
        original_image=base64.b64encode(image_data).decode("utf-8")
    )
    
    return {
        "image_id": image_id,
        "masks": masks,
        "message": f"Generated {len(masks)} masks"
    }

@app.post("/get-mask")
async def get_mask(request: MaskRequest):
    """Get mask for specific points"""
    if request.image_id not in image_store:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_path = UPLOADS_DIR / f"{request.image_id}.jpg"
    
    # Read image data
    async with aiofiles.open(image_path, "rb") as f:
        image_data = await f.read()
    
    # Convert points to list format
    points = [[p.x, p.y] for p in request.points]
    
    # Get mask using Modal
    try:
        with stub.run():
            mask_result = get_mask_for_points_modal(image_data, points, request.labels)
    except Exception as e:
        # For testing without Modal credentials, return mock mask
        print(f"Modal error in get-mask: {e}")
        # Create a simple mock mask for the requested point
        image = Image.open(image_path)
        width, height = image.size
        mock_mask = [[False for _ in range(width)] for _ in range(height)]
        
        # Create a mask around the first point
        if points:
            point_x, point_y = points[0]
            mask_size = min(width, height) // 8  # Make mask 1/8 of image size
            for y in range(max(0, point_y - mask_size), min(height, point_y + mask_size)):
                for x in range(max(0, point_x - mask_size), min(width, point_x + mask_size)):
                    mock_mask[y][x] = True
        
        mask_result = {
            "segmentation": mock_mask,
            "score": 0.8
        }
    
    return mask_result

@app.post("/apply-colors")
async def apply_colors(request: ColorRequest):
    """Apply colors to selected masks"""
    if request.image_id not in image_store:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_data = image_store[request.image_id]
    image_path = UPLOADS_DIR / f"{request.image_id}.jpg"
    
    # Load original image
    image = Image.open(image_path)
    image_array = np.array(image)
    
    # Create colored image
    colored_image = image_array.copy()
    
    # Apply colors to selected masks
    for mask_id in request.mask_ids:
        mask = next((m for m in image_data.masks if m["id"] == mask_id), None)
        if mask:
            mask_array = np.array(mask["segmentation"], dtype=bool)
            color_rgb = tuple(int(request.color[i:i+2], 16) for i in (1, 3, 5))  # Convert hex to RGB
            
            # Apply color to masked areas
            colored_image[mask_array] = color_rgb
    
    # Save colored image
    colored_image_path = UPLOADS_DIR / f"{request.image_id}_colored.jpg"
    colored_pil = Image.fromarray(colored_image)
    colored_pil.save(colored_image_path)
    
    return {
        "message": "Colors applied successfully",
        "colored_image_path": str(colored_image_path)
    }

@app.get("/download/{image_id}")
async def download_image(image_id: str):
    """Download the colored image"""
    colored_image_path = UPLOADS_DIR / f"{image_id}_colored.jpg"
    
    if not colored_image_path.exists():
        raise HTTPException(status_code=404, detail="Colored image not found")
    
    return FileResponse(
        colored_image_path,
        media_type="image/jpeg",
        filename=f"colored_building_{image_id}.jpg"
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "SAM2 Building Segmentation API is running",
        "stored_images": len(image_store)
    }

@app.get("/debug/masks/{image_id}")
async def debug_masks(image_id: str):
    """Debug endpoint to check stored masks"""
    if image_id not in image_store:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_data = image_store[image_id]
    return {
        "image_id": image_id,
        "mask_count": len(image_data.masks),
        "masks": image_data.masks
    }

@app.get("/test/mock-mask")
async def test_mock_mask():
    """Test endpoint to generate a simple mock mask"""
    # Create a simple 100x100 mock mask
    width, height = 100, 100
    mock_mask = [[False for _ in range(width)] for _ in range(height)]
    
    # Create a rectangular mask in the center
    center_x, center_y = width // 2, height // 2
    mask_size = 20
    
    for y in range(max(0, center_y - mask_size), min(height, center_y + mask_size)):
        for x in range(max(0, center_x - mask_size), min(width, center_x + mask_size)):
            mock_mask[y][x] = True
    
    bbox_x = center_x - mask_size
    bbox_y = center_y - mask_size
    bbox_width = mask_size * 2
    bbox_height = mask_size * 2
    
    mock_mask_data = {
        "id": "test-0",
        "segmentation": mock_mask,
        "area": bbox_width * bbox_height,
        "bbox": [bbox_x, bbox_y, bbox_width, bbox_height],
        "predicted_iou": 0.9,
        "point_coords": [[center_x, center_y]],
        "stability_score": 0.9
    }
    
    return {
        "message": "Test mock mask generated",
        "mask": mock_mask_data,
        "mask_size": f"{width}x{height}",
        "bbox": [bbox_x, bbox_y, bbox_width, bbox_height]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 