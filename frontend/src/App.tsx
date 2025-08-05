import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ChromePicker } from 'react-color';
import axios from 'axios';
import { Upload, Download, Palette, Eye, EyeOff, Loader } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';



interface Mask {
  id: string;
  segmentation: boolean[][];
  area: number;
  bbox: number[];
  predicted_iou: number;
  point_coords: number[][];
  stability_score: number;
}

interface ColorMask {
  id: string;
  mask: boolean[][];
  color: string;
}

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [masks, setMasks] = useState<Mask[]>([]);
  const [selectedMasks, setSelectedMasks] = useState<Set<string>>(new Set());
  const [colorMasks, setColorMasks] = useState<ColorMask[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#ff0000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAllMasks, setShowAllMasks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const predefinedColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#888800', '#008888'
  ];

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 5000);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      console.log('Uploading file:', file.name, file.size, file.type);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Making request to:', `${API_BASE_URL}/upload-image`);
      const response = await axios.post(`${API_BASE_URL}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Upload response:', response.data);
      setImage(response.data.image_data);
      setImageId(response.data.image_id);
      setMasks([]);
      setSelectedMasks(new Set());
      setColorMasks([]);
      showStatus('success', 'Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to upload image';
      if (error.response?.status === 413) {
        errorMessage = 'File too large. Please use a smaller image.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid file type. Please use JPG, PNG, or GIF.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      showStatus('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });

  const generateMasks = async () => {
    if (!imageId) return;

    setLoading(true);
    setStatus(null);

    try {
      console.log('Generating masks for image:', imageId);
      const response = await axios.post(`${API_BASE_URL}/generate-masks`, { image_id: imageId });
      console.log('Mask generation response:', response.data);
      
      setMasks(response.data.masks);
      const maskCount = response.data.masks.length;
      console.log(`Generated ${maskCount} masks:`, response.data.masks);
      
      showStatus('success', `Generated ${maskCount} masks!`);
      
      // If using mock masks (for demo without Modal), show a note
      if (maskCount === 1 && response.data.masks[0].id === "0") {
        showStatus('info', 'Demo mode: Using mock masks. Set up Modal credentials for real SAM2 inference.');
      }
    } catch (error) {
      console.error('Mask generation error:', error);
      showStatus('error', 'Failed to generate masks');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageId || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) * (imageRef.current.naturalWidth / rect.width));
    const y = Math.round((event.clientY - rect.top) * (imageRef.current.naturalHeight / rect.height));

    console.log('=== IMAGE CLICK DEBUG ===');
    console.log(`Image clicked at (${x}, ${y})`);
    console.log(`Display rect: ${rect.width}x${rect.height}`);
    console.log(`Natural size: ${imageRef.current.naturalWidth}x${imageRef.current.naturalHeight}`);
    console.log(`Scale factors: ${imageRef.current.naturalWidth / rect.width}, ${imageRef.current.naturalHeight / rect.height}`);
    console.log(`Selected masks before:`, Array.from(selectedMasks));
    console.log(`Available masks:`, masks.length);
    console.log(`Masks data:`, masks);

    // Add a temporary visual indicator for debugging
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw a red dot where you clicked
        const displayRect = imageRef.current.getBoundingClientRect();
        const scaleX = displayRect.width / imageRef.current.naturalWidth;
        const scaleY = displayRect.height / imageRef.current.naturalHeight;
        const displayX = Math.floor(x * scaleX);
        const displayY = Math.floor(y * scaleY);
        
        ctx.fillStyle = 'red';
        ctx.fillRect(displayX - 5, displayY - 5, 10, 10);
        console.log(`Drew red dot at display coordinates (${displayX}, ${displayY})`);
        
        // Clear it after 2 seconds
        setTimeout(() => {
          renderMaskOverlay();
        }, 2000);
      }
    }

    const isShiftKey = event.shiftKey;
    const isRightClick = event.button === 2;

    if (isShiftKey) {
      // Add or remove from selection
      const maskId = await getMaskForPoint(x, y);
      if (maskId) {
        const newSelectedMasks = new Set(selectedMasks);
        if (isRightClick) {
          newSelectedMasks.delete(maskId);
        } else {
          newSelectedMasks.add(maskId);
        }
        setSelectedMasks(newSelectedMasks);
        console.log(`Updated selected masks:`, Array.from(newSelectedMasks));
      }
    } else {
      // Single click - get mask for point
      const maskId = await getMaskForPoint(x, y);
      if (maskId) {
        setSelectedMasks(new Set([maskId]));
        console.log(`Set selected mask:`, maskId);
        showStatus('success', `Selected mask ${maskId}! Now choose a color and click "Apply Color"`);
      } else {
        console.log('No mask found at this location');
        showStatus('error', 'No mask found at this location. Try clicking elsewhere on the image.');
      }
    }
  };

  const getMaskForPoint = async (x: number, y: number): Promise<string | null> => {
    if (!imageId) return null;

    console.log(`Getting mask for point (${x}, ${y})`);
    console.log(`Available masks:`, masks);

    try {
      // Always make the API call for consistency
      await axios.post(`${API_BASE_URL}/get-mask`, {
        image_id: imageId,
        points: [{ x, y }],
        labels: [1]
      });

      // For demo mode, find the closest mask to the clicked point
      if (masks.length > 0) {
        let closestMaskId = masks[0].id;
        let minDistance = Infinity;
        
        // Find the mask whose center is closest to the clicked point
        masks.forEach(mask => {
          if (mask.point_coords && mask.point_coords.length > 0) {
            const centerX = mask.point_coords[0][0];
            const centerY = mask.point_coords[0][1];
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestMaskId = mask.id;
            }
          }
        });
        
        console.log(`Selected mask ${closestMaskId} for point (${x}, ${y}) (distance: ${minDistance.toFixed(1)})`);
        return closestMaskId;
      }

      console.log('No masks available');
      return null;
    } catch (error) {
      console.error('Error getting mask for point:', error);
      // For demo mode, return the closest mask if available
      if (masks.length > 0) {
        let closestMaskId = masks[0].id;
        let minDistance = Infinity;
        
        masks.forEach(mask => {
          if (mask.point_coords && mask.point_coords.length > 0) {
            const centerX = mask.point_coords[0][0];
            const centerY = mask.point_coords[0][1];
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestMaskId = mask.id;
            }
          }
        });
        
        console.log(`Fallback: Selected mask ${closestMaskId} for point (${x}, ${y})`);
        return closestMaskId;
      }
      return null;
    }
  };

  const applyColor = async () => {
    if (selectedMasks.size === 0) {
      showStatus('error', 'Please select masks by clicking on the image first');
      return;
    }
    if (!imageId) return;

    setLoading(true);
    setStatus(null);

    try {
      await axios.post(`${API_BASE_URL}/apply-colors`, {
        image_id: imageId,
        mask_ids: Array.from(selectedMasks),
        color: selectedColor
      });

      // Add to color masks for visualization
      const newColorMasks: ColorMask[] = Array.from(selectedMasks).map(maskId => {
        const mask = masks.find(m => m.id === maskId);
        return {
          id: maskId,
          mask: mask?.segmentation || [],
          color: selectedColor
        };
      });

      setColorMasks([...colorMasks, ...newColorMasks]);
      setSelectedMasks(new Set());
      showStatus('success', 'Color applied successfully!');
    } catch (error) {
      console.error('Error applying color:', error);
      showStatus('error', 'Failed to apply color');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!imageId) return;
    
    if (colorMasks.length === 0) {
      showStatus('error', 'Please apply colors to masks first before downloading');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/download/${imageId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `colored_building_${imageId}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showStatus('success', 'Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      showStatus('error', 'Failed to download image');
    }
  };

  const clearAll = () => {
    setSelectedMasks(new Set());
    setColorMasks([]);
    setShowAllMasks(false);
  };

  const renderMaskOverlay = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('=== RENDER MASK OVERLAY DEBUG ===');
    console.log('Selected masks:', Array.from(selectedMasks));
    console.log('Available masks:', masks.length);
    console.log('Show all masks:', showAllMasks);

    // Get the displayed image dimensions
    const displayRect = imageRef.current.getBoundingClientRect();
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    
    // Set canvas size to match the displayed image size
    canvas.width = displayRect.width;
    canvas.height = displayRect.height;
    
    // Calculate scaling factors
    const scaleX = displayRect.width / naturalWidth;
    const scaleY = displayRect.height / naturalHeight;

    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    console.log(`Scale factors: ${scaleX}, ${scaleY}`);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw masks
    if (showAllMasks) {
      console.log('Rendering all masks...');
      masks.forEach((mask, index) => {
        const maskArray = mask.segmentation;
        // Use more distinct colors for each mask
        const colors = [
          'rgba(255, 0, 0, 0.7)',    // Red
          'rgba(0, 255, 0, 0.7)',    // Green
          'rgba(0, 0, 255, 0.7)',    // Blue
          'rgba(255, 255, 0, 0.7)',  // Yellow
          'rgba(255, 0, 255, 0.7)',  // Magenta
          'rgba(0, 255, 255, 0.7)',  // Cyan
          'rgba(255, 165, 0, 0.7)',  // Orange
          'rgba(128, 0, 128, 0.7)'   // Purple
        ];
        const color = colors[index % colors.length];
        
        console.log(`Rendering mask ${index} (${mask.id}) with color ${color}`);
        ctx.fillStyle = color;
        
        let pixelsRendered = 0;
        for (let y = 0; y < maskArray.length; y++) {
          for (let x = 0; x < maskArray[y].length; x++) {
            if (maskArray[y][x]) {
              const scaledX = Math.floor(x * scaleX);
              const scaledY = Math.floor(y * scaleY);
              ctx.fillRect(scaledX, scaledY, Math.max(1, scaleX), Math.max(1, scaleY));
              pixelsRendered++;
            }
          }
        }
        console.log(`Mask ${index} rendered ${pixelsRendered} pixels`);
      });
    } else {
      console.log('Rendering selected masks...');
      // Draw selected masks with high visibility
      selectedMasks.forEach(maskId => {
        const mask = masks.find(m => m.id === maskId);
        if (mask) {
          const maskArray = mask.segmentation;
          console.log(`Rendering selected mask ${maskId}`);
          // Make the highlight very visible with bright yellow and red border
          ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
          ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
          ctx.lineWidth = 2;
          
          let pixelsRendered = 0;
          for (let y = 0; y < maskArray.length; y++) {
            for (let x = 0; x < maskArray[y].length; x++) {
              if (maskArray[y][x]) {
                const scaledX = Math.floor(x * scaleX);
                const scaledY = Math.floor(y * scaleY);
                const pixelWidth = Math.max(1, scaleX);
                const pixelHeight = Math.max(1, scaleY);
                
                ctx.fillRect(scaledX, scaledY, pixelWidth, pixelHeight);
                // Add border every few pixels for better visibility
                if (x % 5 === 0 && y % 5 === 0) {
                  ctx.strokeRect(scaledX, scaledY, pixelWidth, pixelHeight);
                }
                pixelsRendered++;
              }
            }
          }
          console.log(`Selected mask ${maskId} rendered ${pixelsRendered} pixels`);
        }
      });

      // Draw colored masks
      colorMasks.forEach(colorMask => {
        const maskArray = colorMask.mask;
        ctx.fillStyle = colorMask.color + '80'; // Add transparency
        for (let y = 0; y < maskArray.length; y++) {
          for (let x = 0; x < maskArray[y].length; x++) {
            if (maskArray[y][x]) {
              const scaledX = Math.floor(x * scaleX);
              const scaledY = Math.floor(y * scaleY);
              ctx.fillRect(scaledX, scaledY, Math.max(1, scaleX), Math.max(1, scaleY));
            }
          }
        }
      });
    }
    
    console.log('Mask overlay rendering complete');
  };

  // Render mask overlay when masks change
  React.useEffect(() => {
    renderMaskOverlay();
  }, [masks, selectedMasks, colorMasks, showAllMasks]);

  // Add resize listener to re-render masks when window is resized
  React.useEffect(() => {
    const handleResize = () => {
      renderMaskOverlay();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [masks, selectedMasks, colorMasks, showAllMasks]);

  return (
    <div className="app">
      <div className="header">
        <h1>SAM2 Building Segmentation & Coloring</h1>
        <p>Upload an image of an Indian building and interactively color its different parts</p>
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid #3b82f6', 
          borderRadius: '8px', 
          padding: '0.5rem 1rem', 
          margin: '1rem 0',
          fontSize: '0.9rem'
        }}>
          <strong>Demo Mode:</strong> This application is running in demo mode with mock masks. 
          For real SAM2 inference, set up Modal credentials in the backend environment variables.
        </div>
      </div>

      {status && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}

      <div className="upload-section">
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dragover' : ''}`}>
          <input {...getInputProps()} />
          <Upload size={48} />
          <p>{isDragActive ? 'Drop the image here' : 'Drag & drop an image here, or click to select'}</p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={async () => {
            try {
              const response = await axios.get(`${API_BASE_URL}/health`);
              console.log('API health check:', response.data);
              showStatus('success', 'API connection working!');
            } catch (error) {
              console.error('API health check failed:', error);
              showStatus('error', 'API connection failed. Check if backend is running.');
            }
          }}
          style={{ marginTop: '1rem' }}
        >
          Test API Connection
        </button>
      </div>

      {image && (
        <div className="image-container">
          <img
            ref={imageRef}
            src={image}
            alt="Uploaded building"
            onClick={handleImageClick}
            onContextMenu={(e) => e.preventDefault()}
            onLoad={() => {
              // Force re-render masks when image loads
              setTimeout(() => renderMaskOverlay(), 100);
            }}
            style={{ cursor: 'crosshair' }}
          />
          <canvas
            ref={canvasRef}
            className="mask-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
              borderRadius: '10px'
            }}
          />
          {masks.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              pointerEvents: 'none',
              zIndex: 20
            }}>
              💡 Click anywhere on the image to select masks
              {selectedMasks.size > 0 && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#22c55e' }}>
                  ✓ {selectedMasks.size} mask{selectedMasks.size !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {image && (
        <div className="controls">
          <div className="control-group">
            <button
              className="btn-primary"
              onClick={generateMasks}
              disabled={loading}
            >
              {loading ? <Loader size={16} /> : 'Generate Masks'}
            </button>
            <span>{masks.length > 0 ? `${masks.length} masks generated` : 'No masks yet'}</span>
          </div>

          {masks.length > 0 && (
            <>
              <div className="control-group">
                <button
                  className="btn-secondary"
                  onClick={() => setShowAllMasks(!showAllMasks)}
                >
                  {showAllMasks ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showAllMasks ? 'Hide All Masks' : 'Show All Masks'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (masks.length > 0) {
                      setShowAllMasks(true);
                      showStatus('info', `Showing all ${masks.length} masks in different colors`);
                    }
                  }}
                >
                  Show All Masks
                </button>
              </div>

              <div className="control-group">
                <button className="btn-secondary" onClick={clearAll}>
                  Clear Selection
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    if (masks.length > 0) {
                      setSelectedMasks(new Set([masks[0].id]));
                      showStatus('info', 'Test: Selected first mask automatically');
                    }
                  }}
                >
                  Test: Select First Mask
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={async () => {
                    try {
                      const response = await axios.get(`${API_BASE_URL}/test/mock-mask`);
                      console.log('Test mock mask response:', response.data);
                      const testMask = response.data.mask;
                      setMasks([testMask]);
                      showStatus('success', 'Test mock mask generated!');
                    } catch (error) {
                      console.error('Test mock mask error:', error);
                      showStatus('error', 'Failed to generate test mock mask');
                    }
                  }}
                >
                  Test: Generate Mock Mask
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    console.log('Debug: Current state');
                    console.log('Masks:', masks);
                    console.log('Selected masks:', Array.from(selectedMasks));
                    console.log('Color masks:', colorMasks);
                    console.log('Show all masks:', showAllMasks);
                    renderMaskOverlay();
                    showStatus('info', 'Debug info logged to console');
                  }}
                >
                  Debug: Log State
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {masks.length > 0 && (
        <div className="color-section">
          <h3>Color Selection</h3>
          
          <div className="color-palette">
            {predefinedColors.map((color) => (
              <div
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          <div className="control-group">
            <button
              className="btn-secondary"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette size={16} />
              Custom Color
            </button>
          </div>

          {showColorPicker && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <ChromePicker
                color={selectedColor}
                onChange={(color) => setSelectedColor(color.hex)}
              />
            </div>
          )}

          <div className="button-group">
            {selectedMasks.size > 0 && (
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                border: '1px solid #22c55e', 
                borderRadius: '4px', 
                padding: '0.5rem', 
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <strong>Selected:</strong> {selectedMasks.size} mask{selectedMasks.size !== 1 ? 's' : ''}
              </div>
            )}
            <button
              className="btn-success"
              onClick={applyColor}
              disabled={loading}
            >
              Apply Color
            </button>
            {colorMasks.length > 0 && (
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid #3b82f6', 
                borderRadius: '4px', 
                padding: '0.5rem', 
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <strong>Colored:</strong> {colorMasks.length} area{colorMasks.length !== 1 ? 's' : ''} with colors
              </div>
            )}
            <button
              className="btn-primary"
              onClick={downloadImage}
              disabled={loading}
            >
              <Download size={16} />
              Download Image
            </button>
          </div>
        </div>
      )}

      <div className="instructions">
        <h3>How to use:</h3>
        <ul>
          <li><strong>Upload:</strong> Drag and drop or click to upload an image of an Indian building</li>
          <li><strong>Generate Masks:</strong> Click the button to generate segmentation masks using SAM2</li>
          <li><strong>Select Masks:</strong> Click anywhere on the image to select masks for that area (you'll see a yellow highlight)</li>
          <li><strong>Combine Masks:</strong> Hold Shift and click to add more masks to your selection</li>
          <li><strong>Remove Masks:</strong> Hold Shift and right-click to remove masks from selection</li>
          <li><strong>Choose Color:</strong> Select a color from the palette or use the custom color picker</li>
          <li><strong>Apply Color:</strong> Click "Apply Color" to color the selected areas (you'll see the colored areas appear)</li>
          <li><strong>Download:</strong> Click "Download Image" to save your colored building</li>
        </ul>
        <div style={{ 
          background: 'rgba(255, 193, 7, 0.1)', 
          border: '1px solid #ffc107', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginTop: '1rem',
          fontSize: '0.9rem'
        }}>
          <strong>💡 Tip:</strong> After generating masks, click on different parts of the building to select them, then choose a color and click "Apply Color". You can apply multiple colors to different areas!
        </div>
      </div>
    </div>
  );
};

export default App; 