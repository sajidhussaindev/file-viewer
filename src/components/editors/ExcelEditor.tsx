import React, { useState, useEffect } from 'react';
import { DataGrid } from 'react-data-grid';
import * as XLSX from 'xlsx';
import { Save, Plus, Trash2 } from 'lucide-react';

interface ExcelEditorProps {
  file: {
    id: string;
    name: string;
    url: string;
    content?: string;
  };
  onSave: (editedFile: Blob) => void;
}

interface Row {
  [key: string]: any;
}

export default function ExcelEditor({ file, onSave }: ExcelEditorProps) {
  const [data, setData] = useState<Row[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [worksheetName, setWorksheetName] = useState('Sheet1');

  useEffect(() => {
    loadExcelData();
  }, [file]);

  const loadExcelData = async () => {
    try {
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      setWorksheetName(firstSheetName);
      
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        // First row as headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Create columns configuration
        const cols = headers.map((header, index) => ({
          key: header || `Column${index + 1}`,
          name: header || `Column ${index + 1}`,
          editable: true,
          resizable: true,
        }));
        
        // Create rows data
        const rowsData = rows.map((row, rowIndex) => {
          const rowObj: Row = { id: rowIndex };
          headers.forEach((header, colIndex) => {
            rowObj[header || `Column${colIndex + 1}`] = row[colIndex] || '';
          });
          return rowObj;
        });
        
        setColumns(cols);
        setData(rowsData);
      }
    } catch (error) {
      console.error('Error loading Excel file:', error);
      // Fallback: create empty spreadsheet
      createEmptySpreadsheet();
    }
  };

  const createEmptySpreadsheet = () => {
    const defaultColumns = Array.from({ length: 5 }, (_, i) => ({
      key: `Column${i + 1}`,
      name: `Column ${i + 1}`,
      editable: true,
      resizable: true,
    }));
    
    const defaultRows = Array.from({ length: 10 }, (_, i) => {
      const row: Row = { id: i };
      defaultColumns.forEach(col => {
        row[col.key] = '';
      });
      return row;
    });
    
    setColumns(defaultColumns);
    setData(defaultRows);
  };

  const handleRowsChange = (rows: Row[]) => {
    setData(rows);
  };

  const addRow = () => {
    const newRow: Row = { id: data.length };
    columns.forEach(col => {
      newRow[col.key] = '';
    });
    setData(prev => [...prev, newRow]);
  };

  const addColumn = () => {
    const newColumnKey = `Column${columns.length + 1}`;
    const newColumn = {
      key: newColumnKey,
      name: `Column ${columns.length + 1}`,
      editable: true,
      resizable: true,
    };
    
    setColumns(prev => [...prev, newColumn]);
    setData(prev => prev.map(row => ({ ...row, [newColumnKey]: '' })));
  };

  const deleteRow = (rowIndex: number) => {
    setData(prev => prev.filter((_, index) => index !== rowIndex));
  };

  const handleSave = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Convert data to worksheet format
      const headers = columns.map(col => col.name);
      const wsData = [
        headers,
        ...data.map(row => columns.map(col => row[col.key] || ''))
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, worksheetName);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      onSave(blob);
    } catch (error) {
      console.error('Error saving Excel file:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Excel Editor</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </button>
            <button
              onClick={addColumn}
              className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Column
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Excel
        </button>
      </div>

      {/* Data Grid */}
      <div className="flex-1 p-4">
        <div className="h-full border border-gray-200 rounded-lg overflow-hidden">
          <DataGrid
            columns={columns}
            rows={data}
            onRowsChange={handleRowsChange}
            className="rdg-light"
            style={{ height: '100%' }}
            rowKeyGetter={(row) => row.id}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        {data.length} rows × {columns.length} columns
      </div>
    </div>
  );
}