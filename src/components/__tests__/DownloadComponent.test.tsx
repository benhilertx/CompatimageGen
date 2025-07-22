import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DownloadComponent from '../DownloadComponent';

// Simplified tests that don't rely on document mocking
describe('DownloadComponent', () => {
  it('renders the download button', () => {
    render(<DownloadComponent processId="test-process-id" />);
    
    expect(screen.getByText('Download ZIP Package')).toBeDefined();
    expect(screen.getByText('HTML snippet with all fallbacks')).toBeDefined();
    expect(screen.getByText('PNG fallback image')).toBeDefined();
    expect(screen.getByText('Email client preview images')).toBeDefined();
    expect(screen.getByText('Integration instructions')).toBeDefined();
  });
  
  it('shows loading state when isGenerating is true', () => {
    render(<DownloadComponent processId="test-process-id" isGenerating={true} />);
    
    expect(screen.getByText('Generating...')).toBeDefined();
    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });
});