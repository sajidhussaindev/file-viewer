import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileViewer from './components/FileViewer';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  content?: string;
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  const handleFileUpload = async (files: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      
      // For text-based files, read the content
      let content = '';
      if (file.type.includes('text') || file.name.endsWith('.csv')) {
        try {
          content = await file.text();
        } catch (error) {
          console.error('Error reading file content:', error);
        }
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url,
        content
      });
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (file: UploadedFile) => {
    setSelectedFile(file);
  };

  const handleFileDelete = (id: string) => {
    setUploadedFiles(prev => {
      const fileToDelete = prev.find(f => f.id === id);
      if (fileToDelete) {
        URL.revokeObjectURL(fileToDelete.url);
      }
      return prev.filter(f => f.id !== id);
    });
    
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  };

  const handleFileUpdate = (id: string, updatedFile: Blob) => {
    const newUrl = URL.createObjectURL(updatedFile);
    
    setUploadedFiles(prev => prev.map(file => {
      if (file.id === id) {
        // Revoke old URL to prevent memory leaks
        URL.revokeObjectURL(file.url);
        return {
          ...file,
          url: newUrl,
          size: updatedFile.size,
        };
      }
      return file;
    }));

    // Update selected file if it's the one being updated
    if (selectedFile?.id === id) {
      setSelectedFile(prev => prev ? {
        ...prev,
        url: newUrl,
        size: updatedFile.size,
      } : null);
    }
  };

  const handleCloseViewer = () => {
    setSelectedFile(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        onFileUpload={handleFileUpload}
        uploadedFiles={uploadedFiles}
        onFileSelect={handleFileSelect}
        onFileDelete={handleFileDelete}
        selectedFileId={selectedFile?.id || null}
      />
      <FileViewer
        file={selectedFile}
        onClose={handleCloseViewer}
        onFileUpdate={handleFileUpdate}
      />
    </div>
  );
}

export default App;