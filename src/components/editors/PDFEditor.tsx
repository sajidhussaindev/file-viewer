import React, { useEffect, useRef, useState } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Save, Type, Square, Circle } from 'lucide-react';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFEditorProps {
  file: {
    id: string;
    name: string;
    url: string;
  };
  onSave: (editedFile: Blob) => void;
}

interface Annotation {
  id: string;
  type: 'text' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
}

export default function PDFEditor({ file, onSave }: PDFEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'text' | 'rectangle' | 'circle'>('text');
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    loadPDF();
  }, [file.url]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale]);

  const loadPDF = async () => {
    try {
      const pdf = await pdfjsLib.getDocument(file.url).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    
    // Render annotations
    renderAnnotations(context, viewport);
  };

  const renderAnnotations = (context: CanvasRenderingContext2D, viewport: any) => {
    annotations.forEach(annotation => {
      context.save();
      context.strokeStyle = annotation.color;
      context.fillStyle = annotation.color;
      context.lineWidth = 2;

      const x = annotation.x * scale;
      const y = viewport.height - (annotation.y * scale);

      switch (annotation.type) {
        case 'text':
          context.font = '16px Arial';
          context.fillText(annotation.text || 'Text', x, y);
          break;
        case 'rectangle':
          context.strokeRect(x, y - (annotation.height || 50) * scale, 
                           (annotation.width || 100) * scale, (annotation.height || 50) * scale);
          break;
        case 'circle':
          context.beginPath();
          context.arc(x, y, (annotation.width || 25) * scale, 0, 2 * Math.PI);
          context.stroke();
          break;
      }
      context.restore();
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (canvas.height - (event.clientY - rect.top)) / scale;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      color: '#ff0000',
      ...(selectedTool === 'text' && { text: 'New Text' }),
      ...(selectedTool !== 'text' && { width: 100, height: 50 }),
    };

    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const handleSave = async () => {
    try {
      // Fetch the original PDF
      const existingPdfBytes = await fetch(file.url).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Add annotations to the PDF
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];
      
      annotations.forEach(annotation => {
        switch (annotation.type) {
          case 'text':
            page.drawText(annotation.text || 'Text', {
              x: annotation.x,
              y: annotation.y,
              size: 12,
              color: rgb(1, 0, 0),
            });
            break;
          case 'rectangle':
            page.drawRectangle({
              x: annotation.x,
              y: annotation.y - (annotation.height || 50),
              width: annotation.width || 100,
              height: annotation.height || 50,
              borderColor: rgb(1, 0, 0),
              borderWidth: 2,
            });
            break;
          case 'circle':
            page.drawCircle({
              x: annotation.x,
              y: annotation.y,
              size: annotation.width || 25,
              borderColor: rgb(1, 0, 0),
              borderWidth: 2,
            });
            break;
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      onSave(blob);
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTool('text')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedTool('rectangle')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedTool('circle')}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Circle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              -
            </button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(prev => Math.min(3, prev + 0.25))}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save PDF
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-gray-300 shadow-lg cursor-crosshair bg-white"
          />
        </div>
      </div>
    </div>
  );
}