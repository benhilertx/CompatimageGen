import { NextRequest } from 'next/server';
import { GET, updateProcessingStatus, addProcessingWarning } from '../route';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { describe } from 'vitest';

// Mock NextRequest
const createMockRequest = (includeHistory = false) => {
  const searchParams = new URLSearchParams();
  if (includeHistory) {
    searchParams.set('includeHistory', 'true');
  }
  
  return {
    nextUrl: {
      searchParams,
    },
  } as unknown as NextRequest;
};

describe('Status API', () => {
  test('GET returns 404 for non-existent process ID', async () => {
    const request = createMockRequest();
    const response = await GET(request, { params: { processId: 'non-existent-id' } });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Process not found');
  });
  
  test('GET returns correct status for existing process ID', async () => {
    const processId = 'test-process-id-' + Date.now();
    const testStatus = {
      step: 'generating-fallbacks' as const,
      progress: 75,
      message: 'Generating PNG fallback'
    };
    const testWarnings = [{
      type: 'file-size' as const,
      message: 'File size is approaching email client limits',
      severity: 'low' as const
    }];
    
    // Update status
    updateProcessingStatus(processId, testStatus, testWarnings);
    
    // Request status
    const request = createMockRequest();
    const response = await GET(request, { params: { processId } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toEqual(testStatus);
    expect(data.warnings).toEqual(testWarnings);
    expect(data.lastUpdated).toBeDefined();
    expect(data.history).toBeUndefined(); // History should not be included by default
  });
  
  test('GET returns history when includeHistory=true', async () => {
    const processId = 'test-process-id-' + Date.now();
    
    // Initial status
    updateProcessingStatus(processId, {
      step: 'validating',
      progress: 0,
      message: 'Starting validation'
    });
    
    // Update status
    updateProcessingStatus(processId, {
      progress: 50,
      message: 'Validation in progress'
    });
    
    // Request status with history
    const request = createMockRequest(true);
    const response = await GET(request, { params: { processId } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.history).toBeDefined();
    expect(data.history.length).toBe(2);
    expect(data.history[0].status.progress).toBe(0);
    expect(data.history[1].status.progress).toBe(50);
  });
  
  test('updateProcessingStatus correctly updates existing status', async () => {
    const processId = 'test-process-id-' + Date.now();
    
    // Initial status
    updateProcessingStatus(processId, {
      step: 'validating',
      progress: 0,
      message: 'Starting validation'
    });
    
    // Update status
    updateProcessingStatus(processId, {
      progress: 50,
      message: 'Validation in progress'
    });
    
    // Request status
    const request = createMockRequest();
    const response = await GET(request, { params: { processId } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toEqual({
      step: 'validating',
      progress: 50,
      message: 'Validation in progress'
    });
  });
  
  test('addProcessingWarning correctly adds a warning', async () => {
    const processId = 'test-process-id-' + Date.now();
    
    // Initial status with no warnings
    updateProcessingStatus(processId, {
      step: 'validating',
      progress: 0,
      message: 'Starting validation'
    }, []);
    
    // Add a warning
    const warning = {
      type: 'svg-complexity' as const,
      message: 'SVG contains complex gradients',
      severity: 'medium' as const
    };
    addProcessingWarning(processId, warning);
    
    // Request status
    const request = createMockRequest();
    const response = await GET(request, { params: { processId } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0]).toEqual(warning);
  });
});