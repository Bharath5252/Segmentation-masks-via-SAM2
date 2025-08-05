import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app
import tempfile
import os
from PIL import Image
import io

client = TestClient(app)

class TestHealthEndpoint:
    def test_health_check(self):
        """Test the health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "message" in data
        assert "stored_images" in data

class TestUploadEndpoint:
    def test_upload_image_success(self):
        """Test successful image upload"""
        # Create a test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
        response = client.post("/upload-image", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "image_id" in data
        assert "message" in data
        assert "image_data" in data
        assert data["message"] == "Image uploaded successfully"

    def test_upload_invalid_file_type(self):
        """Test upload with invalid file type"""
        # Create a text file instead of image
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        response = client.post("/upload-image", files=files)
        
        assert response.status_code == 400
        assert "File must be an image" in response.json()["detail"]

    def test_upload_no_file(self):
        """Test upload without file"""
        response = client.post("/upload-image")
        assert response.status_code == 422

class TestGenerateMasksEndpoint:
    def test_generate_masks_no_image(self):
        """Test mask generation without uploaded image"""
        response = client.post("/generate-masks", json={"image_id": "nonexistent"})
        assert response.status_code == 404
        assert "Image not found" in response.json()["detail"]

    def test_generate_masks_success(self):
        """Test successful mask generation"""
        # First upload an image
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
        upload_response = client.post("/upload-image", files=files)
        image_id = upload_response.json()["image_id"]
        
        # Then generate masks
        response = client.post("/generate-masks", json={"image_id": image_id})
        assert response.status_code == 200
        data = response.json()
        assert "masks" in data
        assert "message" in data
        assert len(data["masks"]) > 0

class TestGetMaskEndpoint:
    def test_get_mask_no_image(self):
        """Test getting mask for non-existent image"""
        response = client.post("/get-mask", json={
            "image_id": "nonexistent",
            "points": [{"x": 50, "y": 50}],
            "labels": [1]
        })
        assert response.status_code == 404
        assert "Image not found" in response.json()["detail"]

    def test_get_mask_success(self):
        """Test successful mask retrieval"""
        # First upload an image and generate masks
        img = Image.new('RGB', (100, 100), color='green')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
        upload_response = client.post("/upload-image", files=files)
        image_id = upload_response.json()["image_id"]
        
        # Generate masks
        client.post("/generate-masks", json={"image_id": image_id})
        
        # Get mask for a point
        response = client.post("/get-mask", json={
            "image_id": image_id,
            "points": [{"x": 50, "y": 50}],
            "labels": [1]
        })
        assert response.status_code == 200
        data = response.json()
        assert "segmentation" in data or "score" in data

class TestApplyColorsEndpoint:
    def test_apply_colors_no_image(self):
        """Test applying colors to non-existent image"""
        response = client.post("/apply-colors", json={
            "image_id": "nonexistent",
            "mask_ids": ["0"],
            "color": "#ff0000"
        })
        assert response.status_code == 404
        assert "Image not found" in response.json()["detail"]

    def test_apply_colors_success(self):
        """Test successful color application"""
        # First upload an image and generate masks
        img = Image.new('RGB', (100, 100), color='yellow')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
        upload_response = client.post("/upload-image", files=files)
        image_id = upload_response.json()["image_id"]
        
        # Generate masks
        masks_response = client.post("/generate-masks", json={"image_id": image_id})
        mask_ids = [mask["id"] for mask in masks_response.json()["masks"]]
        
        # Apply colors
        response = client.post("/apply-colors", json={
            "image_id": image_id,
            "mask_ids": mask_ids[:1],  # Apply to first mask
            "color": "#ff0000"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

class TestDownloadEndpoint:
    def test_download_no_image(self):
        """Test downloading non-existent image"""
        response = client.get("/download/nonexistent")
        assert response.status_code == 404

    def test_download_success(self):
        """Test successful image download"""
        # First upload an image
        img = Image.new('RGB', (100, 100), color='purple')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
        upload_response = client.post("/upload-image", files=files)
        image_id = upload_response.json()["image_id"]
        
        # Download the image
        response = client.get(f"/download/{image_id}")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"

class TestDebugEndpoints:
    def test_debug_masks_no_image(self):
        """Test debug masks endpoint for non-existent image"""
        response = client.get("/debug/masks/nonexistent")
        assert response.status_code == 404
        assert "Image not found" in response.json()["detail"]

    def test_debug_masks_success(self):
        """Test successful debug masks retrieval"""
        # First upload an image and generate masks
        img = Image.new('RGB', (100, 100), color='orange')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
        upload_response = client.post("/upload-image", files=files)
        image_id = upload_response.json()["image_id"]
        
        # Generate masks
        client.post("/generate-masks", json={"image_id": image_id})
        
        # Get debug info
        response = client.get(f"/debug/masks/{image_id}")
        assert response.status_code == 200
        data = response.json()
        assert "mask_count" in data
        assert "masks" in data

    def test_test_mock_mask(self):
        """Test the mock mask generation endpoint"""
        response = client.get("/test/mock-mask")
        assert response.status_code == 200
        data = response.json()
        assert "mask" in data
        assert "mask_size" in data
        assert "bbox" in data

class TestErrorHandling:
    def test_invalid_json(self):
        """Test handling of invalid JSON"""
        response = client.post("/generate-masks", data="invalid json")
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        response = client.post("/generate-masks", json={})
        assert response.status_code == 422

if __name__ == "__main__":
    pytest.main([__file__]) 