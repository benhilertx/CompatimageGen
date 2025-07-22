import { useState, useCallback } from 'react';

interface UseDragAndDropProps {
  onFileDrop: (files: FileList) => void;
}

interface UseDragAndDropResult {
  dragActive: boolean;
  handleDrag: (e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => void;
}

/**
 * Custom hook for handling drag and drop functionality
 * @param onFileDrop Callback function to handle dropped files
 * @returns Object containing drag state and event handlers
 */
export const useDragAndDrop = ({ onFileDrop }: UseDragAndDropProps): UseDragAndDropResult => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  }, [onFileDrop]);
  
  return {
    dragActive,
    handleDrag,
    handleDrop
  };
};

export default useDragAndDrop;