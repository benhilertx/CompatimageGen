import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PreviewComponent from '../PreviewComponent';
import { ClientPreview } from '@/types';

// Mock data for testing
const mockPreviews: ClientPreview[] = [
  {
    client: 'apple-mail',
    fallbackUsed: 'svg',
    estimatedQuality: 'excellent',
    previewImage: Buffer.from('mock-image-data')
  },
  {
    client: 'gmail',
    fallbackUsed: 'png',
    estimatedQuality: 'good',
    previewImage: Buffer.from('mock-image-data')
  },
  {
    client: 'outlook-desktop',
    fallbackUsed: 'vml',
    estimatedQuality: 'fair',
    previewImage: Buffer.from('mock-image-data')
  }
];

const mockHtmlCode = '<div>Mock HTML code</div>';

describe('PreviewComponent', () => {
  it('renders the component with all previews', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Check if the component title is rendered
    expect(screen.getByText('Email Client Previews')).toBeInTheDocument();
    
    // Check if all client buttons are rendered
    expect(screen.getByText('All Clients')).toBeInTheDocument();
    expect(screen.getByText('Apple Mail')).toBeInTheDocument();
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Outlook Desktop')).toBeInTheDocument();
    
    // Check if all preview cards are rendered
    expect(screen.getAllByText(/Fallback Used:/i)).toHaveLength(3);
    expect(screen.getAllByText(/Rendering Quality:/i)).toHaveLength(3);
  });

  it('filters previews when a client is selected', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Click on Gmail button
    fireEvent.click(screen.getByText('Gmail'));
    
    // Should only show Gmail preview
    const fallbackTexts = screen.getAllByText(/Fallback Used:/i);
    expect(fallbackTexts).toHaveLength(1);
    
    // Check if the correct fallback type is displayed
    expect(screen.getByText('PNG (Raster)')).toBeInTheDocument();
    expect(screen.queryByText('SVG (Vector)')).not.toBeInTheDocument();
  });

  it('shows HTML code when toggle button is clicked', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // HTML code should not be visible initially
    expect(screen.queryByText(mockHtmlCode)).not.toBeInTheDocument();
    
    // Click on Show HTML Code button
    fireEvent.click(screen.getByText('Show HTML Code'));
    
    // HTML code should now be visible
    expect(screen.getByText(mockHtmlCode)).toBeInTheDocument();
    
    // Button text should change
    expect(screen.getByText('Hide HTML Code')).toBeInTheDocument();
  });

  it('displays correct quality ratings with appropriate colors', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Check if quality ratings are displayed correctly
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('handles empty previews array', () => {
    render(<PreviewComponent previews={[]} htmlCode={mockHtmlCode} />);
    
    // Should show no previews message
    expect(screen.getByText('No previews available for the selected client')).toBeInTheDocument();
  });
});