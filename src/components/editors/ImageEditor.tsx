import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Save, Type, Square, Circle, Brush, Trash2, RotateCw, Palette } from 'lucide-react';

interface ImageEditorProps {
  file: {
    id: string;
    name: string;
    url: string;
  };
  onSave: (editedFile: Blob) => void;
}

export default function ImageEditor({ file, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'brush'>('select');
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushWidth, setBrushWidth] = useState(5);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'white',
      });

      setCanvas(fabricCanvas);

      // Load the image
      fabric.Image.fromURL(file.url, (img) => {
        // Check if canvas is still valid before rendering
        if (!fabricCanvas.contextContainer) {
          return;
        }

        // Scale image to fit canvas
        const scale = Math.min(
          fabricCanvas.width! / img.width!,
          fabricCanvas.height! / img.height!
        );
        
        img.scale(scale);
        img.set({
          left: (fabricCanvas.width! - img.width! * scale) / 2,
          top: (fabricCanvas.height! - img.height! * scale) / 2,
          selectable: false,
        });
        
        fabricCanvas.add(img);
        fabricCanvas.sendToBack(img);
        fabricCanvas.renderAll();
      });

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [file.url]);

  useEffect(() => {
    if (!canvas) return;

    // Configure canvas based on selected tool
    switch (selectedTool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;
      case 'brush':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushWidth;
        canvas.selection = false;
        break;
      default:
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;
    }
  }, [canvas, selectedTool, brushColor, brushWidth]);

  const addText = () => {
    if (!canvas) return;
    
    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: brushColor,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    if (!canvas) return;
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 60,
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: 2,
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: 2,
    });
    
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas) return;
    
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const rotateImage = () => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + 90);
      canvas.renderAll();
    }
  };

  const handleSave = () => {
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png', 1);
  };

  const handleToolClick = (tool: typeof selectedTool) => {
    setSelectedTool(tool);
    
    // Execute tool-specific actions
    switch (tool) {
      case 'text':
        addText();
        break;
      case 'rectangle':
        addRectangle();
        break;
      case 'circle':
        addCircle();
        break;
    }
  };

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTool('select')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Select"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
            <button
              onClick={() => handleToolClick('text')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Add Text"
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleToolClick('rectangle')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Add Rectangle"
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleToolClick('circle')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Add Circle"
            >
              <Circle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedTool('brush')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'brush' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Brush"
            >
              <Brush className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-6 h-6 rounded border-2 ${
                    brushColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            {selectedTool === 'brush' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">{brushWidth}px</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={rotateImage}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={deleteSelected}
              className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Image
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 shadow-lg bg-white"
          />
        </div>
      </div>
    </div>
  );
}