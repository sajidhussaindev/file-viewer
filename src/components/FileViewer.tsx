import React, { useState } from 'react';
import { Download, Edit3, Save, X, FileText } from 'lucide-react';
import PDFEditor from './editors/PDFEditor';
import ExcelEditor from './editors/ExcelEditor';
import ImageEditor from './editors/ImageEditor';

interface FileViewerProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    content?: string;
  } | null;
  onClose: () => void;
  onFileUpdate: (id: string, updatedFile: Blob) => void;
}

export default function FileViewer({ file, onClose, onFileUpdate }: FileViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No file selected</h3>
          <p className="text-gray-500">Select a file from the sidebar to view or edit</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(file.content || '');
  };

  const handleSave = () => {
    console.log('Saving edited content:', editedContent);
    setIsEditing(false);
  };

  const handleFileSave = (editedFile: Blob) => {
    onFileUpdate(file.id, editedFile);
    setIsEditing(false);
  };

  const renderEditor = () => {
    if (file.type.includes('pdf')) {
      return <PDFEditor file={file} onSave={handleFileSave} />;
    }

    if (file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      return <ExcelEditor file={file} onSave={handleFileSave} />;
    }

    if (file.type.includes('image')) {
      return <ImageEditor file={file} onSave={handleFileSave} />;
    }

    // Text editor fallback
    return (
      <div className="h-full p-6">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full h-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Edit your content here..."
        />
      </div>
    );
  };

  const renderViewer = () => {
    if (file.type.includes('image')) {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    if (file.type.includes('pdf')) {
      return (
        <div className="h-full">
          <iframe
            src={file.url}
            className="w-full h-full border-0 rounded-lg"
            title={file.name}
          />
        </div>
      );
    }

    if (file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.csv')) {
      return (
        <div className="h-full p-6 bg-white rounded-lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Excel/CSV Preview</h3>
            <p className="text-sm text-gray-500">
              Click "Edit" to open the full spreadsheet editor
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Column A</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Column B</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Column C</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-sm text-gray-900">Data {row}-1</td>
                    <td className="px-4 py-2 text-sm text-gray-900">Data {row}-2</td>
                    <td className="px-4 py-2 text-sm text-gray-900">Data {row}-3</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full p-6">
        <div className="w-full h-full p-4 bg-gray-50 rounded-lg overflow-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {file.content || 'No content available for preview'}
          </pre>
        </div>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editing: {file.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {file.type} • {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1">
          {renderEditor()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{file.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {file.type} • {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {renderViewer()}
      </div>
    </div>
  );
}