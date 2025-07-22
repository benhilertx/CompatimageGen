import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';

describe('useDragAndDrop', () => {
  const mockOnFileDrop = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with dragActive as false', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFileDrop: mockOnFileDrop }));
    
    expect(result.current.dragActive).toBe(false);
  });
  
  it('should set dragActive to true on dragenter', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFileDrop: mockOnFileDrop }));
    
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      type: 'dragenter'
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    act(() => {
      result.current.handleDrag(mockEvent);
    });
    
    expect(result.current.dragActive).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
  
  it('should set dragActive to true on dragover', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFileDrop: mockOnFileDrop }));
    
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      type: 'dragover'
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    act(() => {
      result.current.handleDrag(mockEvent);
    });
    
    expect(result.current.dragActive).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
  
  it('should set dragActive to false on dragleave', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFileDrop: mockOnFileDrop }));
    
    // First set dragActive to true
    act(() => {
      result.current.handleDrag({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'dragenter'
      } as unknown as React.DragEvent<HTMLDivElement>);
    });
    
    expect(result.current.dragActive).toBe(true);
    
    // Then test dragleave
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      type: 'dragleave'
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    act(() => {
      result.current.handleDrag(mockEvent);
    });
    
    expect(result.current.dragActive).toBe(false);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
  
  it('should call onFileDrop when files are dropped', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFileDrop: mockOnFileDrop }));
    
    const mockFiles = [{}, {}] as unknown as FileList;
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: mockFiles
      }
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    act(() => {
      result.current.handleDrop(mockEvent);
    });
    
    expect(result.current.dragActive).toBe(false);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockOnFileDrop).toHaveBeenCalledWith(mockFiles);
  });
  
  it('should not call onFileDrop when no files are dropped', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFileDrop: mockOnFileDrop }));
    
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: []
      }
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    act(() => {
      result.current.handleDrop(mockEvent);
    });
    
    expect(result.current.dragActive).toBe(false);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockOnFileDrop).not.toHaveBeenCalled();
  });
});