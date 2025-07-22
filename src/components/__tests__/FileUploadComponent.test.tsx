import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploadComponent from '../FileUploadComponent';
import { FileValidator } from '@/lib/utils/file-validator';

// Mock the FileValidator
jest.mock('@/lib/utils/file-validator', () => ({
  FileValidator: {
    validateFile: jest.fn()
  }
}));

describe('FileUploadComponent', () => {
  const mockOnFileUpload = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the component correctly', () => {
    render(<FileUploadComponent onFileUpload={mockOnFileUpload} />);
    
    // Check if the component renders the main text
    expect(screen.getByText(/Drag and drop your logo file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Files/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports svg, png, jpg, jpeg, css files/i)).toBeInTheDocument();
  });
  
  it('shows upload progress when isUploading is true', () => {
    render(
      <FileUploadComponent 
        onFileUpload={mockOnFileUpload} 
        isUploading={true} 
        uploadProgress={50} 
      />
    );
    
    expect(screen.getByText(/Uploading file.../i)).toBeInTheDocument();
  });
  
  it('handles file selection via button click', () => {
    // Mock validation result
    const mockValidationResult = { valid: true, errors: [], warnings: [] };
    (FileValidator.validateFile as jest.Mock).mockReturnValue(mockValidationResult);
    
    render(<FileUploadComponent onFileUpload={mockOnFileUpload} />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'test.svg', { type: 'image/svg+xml' });
    
    // Get the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if onFileUpload was called with the file
    expect(mockOnFileUpload).toHaveBeenCalledWith(file, mockValidationResult);
  });
  
  it('displays error message when file validation fails', () => {
    // Mock validation failure
    const mockValidationResult = { 
      valid: false, 
      errors: ['File size exceeds the maximum limit of 1MB'], 
      warnings: [] 
    };
    (FileValidator.validateFile as jest.Mock).mockReturnValue(mockValidationResult);
    
    render(<FileUploadComponent onFileUpload={mockOnFileUpload} />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'test.svg', { type: 'image/svg+xml' });
    
    // Get the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if error message is displayed
    expect(screen.getByText(/File size exceeds the maximum limit of 1MB/i)).toBeInTheDocument();
    
    // Check that onFileUpload was not called
    expect(mockOnFileUpload).not.toHaveBeenCalled();
  });
  
  it('displays warnings when file validation has warnings', () => {
    // Mock validation with warnings
    const mockValidationResult = { 
      valid: true, 
      errors: [], 
      warnings: ['Complex SVG elements may not convert well to VML for Outlook.'] 
    };
    (FileValidator.validateFile as jest.Mock).mockReturnValue(mockValidationResult);
    
    render(<FileUploadComponent onFileUpload={mockOnFileUpload} />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'test.svg', { type: 'image/svg+xml' });
    
    // Get the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if warning message is displayed
    expect(screen.getByText(/Complex SVG elements may not convert well to VML for Outlook./i)).toBeInTheDocument();
    
    // Check that onFileUpload was called
    expect(mockOnFileUpload).toHaveBeenCalledWith(file, mockValidationResult);
  });
});