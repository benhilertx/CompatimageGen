import { useState, useCallback, useEffect } from 'react';

interface UseDragAndDropProps {
  onFileDrop: (files: FileList | null | undefined) => void;
}

interface UseDragAndDropResult {
  dragActive: boolean;
  handleDrag: (e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement | HTMLFormElement>) => void;
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement | HTMLFormElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement | HTMLFormElement>) => void;
  isTouchDevice: boolean;
}

/**
 * Custom hook for handling drag and drop functionality with touch support
 * @param onFileDrop Callback function to handle dropped files
 * @returns Object containing drag state and event handlers
 */
export const useDragAndDrop = ({ onFileDrop }: UseDragAndDropProps): UseDragAndDropResult => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  
  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
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
    
    // Call onFileDrop with the files (or null if no files)
    onFileDrop(e.dataTransfer.files && e.dataTransfer.files.length > 0 ? e.dataTransfer.files : null);
  }, [onFileDrop]);
  
  // Handle touch start event - visual feedback for touch devices
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement | HTMLFormElement>) => {
    // Only provide visual feedback, don't prevent default to allow scrolling
    setDragActive(true);
  }, []);
  
  // Handle touch end event
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement | HTMLFormElement>) => {
    setDragActive(false);
  }, []);
  
  return {
    dragActive,
    handleDrag,
    handleDrop,
    handleTouchStart,
    handleTouchEnd,
    isTouchDevice
  };
};

export default useDragAndDrop;