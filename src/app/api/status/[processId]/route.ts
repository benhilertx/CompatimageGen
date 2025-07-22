import { NextRequest, NextResponse } from 'next/server';
import { ProcessingStatus, Warning } from '@/types';

// In-memory storage for processing status (would be replaced with a database in production)
const processingStatusMap = new Map<string, {
  status: ProcessingStatus;
  warnings: Warning[];
  lastUpdated: number;
  history: Array<{
    timestamp: number;
    status: ProcessingStatus;
  }>;
}>();

// Processing steps in order
export const PROCESSING_STEPS: ProcessingStatus['step'][] = [
  'validating',
  'optimizing',
  'generating-fallbacks',
  'creating-html',
  'packaging',
  'complete'
];

// Initialize some test data with simulated progress
processingStatusMap.set('test-process-id', {
  status: {
    step: 'optimizing',
    progress: 45,
    message: 'Optimizing SVG file'
  },
  warnings: [{
    type: 'svg-complexity',
    message: 'SVG contains complex gradients that may not render correctly in Outlook',
    severity: 'medium'
  }],
  lastUpdated: Date.now(),
  history: [
    {
      timestamp: Date.now() - 5000,
      status: {
        step: 'validating',
        progress: 100,
        message: 'Validation complete'
      }
    },
    {
      timestamp: Date.now() - 3000,
      status: {
        step: 'optimizing',
        progress: 20,
        message: 'Starting SVG optimization'
      }
    },
    {
      timestamp: Date.now(),
      status: {
        step: 'optimizing',
        progress: 45,
        message: 'Optimizing SVG file'
      }
    }
  ]
});

// Simulate processing progress for the test process ID
let testProcessingInterval: NodeJS.Timeout | null = null;

// Start simulated processing for test process ID
function startTestProcessing() {
  if (testProcessingInterval) {
    clearInterval(testProcessingInterval);
  }
  
  // Reset test process to beginning
  updateProcessingStatus('test-process-id', {
    step: 'validating',
    progress: 0,
    message: 'Starting validation'
  }, []);
  
  let currentStepIndex = 0;
  let currentProgress = 0;
  
  testProcessingInterval = setInterval(() => {
    currentProgress += 10;
    
    if (currentProgress > 100) {
      currentProgress = 0;
      currentStepIndex++;
      
      // Add a warning at the generating-fallbacks step
      if (PROCESSING_STEPS[currentStepIndex] === 'generating-fallbacks') {
        updateProcessingStatus(
          'test-process-id',
          {
            step: PROCESSING_STEPS[currentStepIndex],
            progress: currentProgress,
            message: `Starting ${PROCESSING_STEPS[currentStepIndex]}`
          },
          [
            {
              type: 'svg-complexity',
              message: 'SVG contains complex gradients that may not render correctly in Outlook',
              severity: 'medium'
            }
          ]
        );
      } else {
        updateProcessingStatus('test-process-id', {
          step: PROCESSING_STEPS[currentStepIndex],
          progress: currentProgress,
          message: `Starting ${PROCESSING_STEPS[currentStepIndex]}`
        });
      }
    } else {
      updateProcessingStatus('test-process-id', {
        progress: currentProgress,
        message: `${PROCESSING_STEPS[currentStepIndex]} in progress: ${currentProgress}%`
      });
    }
    
    // Stop when complete
    if (PROCESSING_STEPS[currentStepIndex] === 'complete' && currentProgress >= 100) {
      clearInterval(testProcessingInterval!);
      testProcessingInterval = null;
    }
  }, 1000);
}

// Start test processing simulation
startTestProcessing();

/**
 * Updates the processing status for a given process ID
 */
export function updateProcessingStatus(
  processId: string, 
  status: Partial<ProcessingStatus>,
  warnings?: Warning[]
): void {
  const currentData = processingStatusMap.get(processId) || {
    status: {
      step: 'validating',
      progress: 0,
      message: 'Starting validation'
    },
    warnings: [],
    lastUpdated: Date.now(),
    history: []
  };
  
  // Create updated status
  const updatedStatus = { ...currentData.status, ...status };
  const timestamp = Date.now();
  
  // Update status
  processingStatusMap.set(processId, {
    status: updatedStatus,
    warnings: warnings !== undefined ? warnings : currentData.warnings,
    lastUpdated: timestamp,
    history: [
      ...currentData.history,
      {
        timestamp,
        status: { ...updatedStatus }
      }
    ]
  });
}

/**
 * Adds a warning to the processing status
 */
export function addProcessingWarning(
  processId: string,
  warning: Warning
): void {
  const currentData = processingStatusMap.get(processId);
  if (!currentData) return;
  
  processingStatusMap.set(processId, {
    ...currentData,
    warnings: [...currentData.warnings, warning],
    lastUpdated: Date.now()
  });
}

/**
 * GET handler for retrieving processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { processId: string } }
) {
  const { processId } = params;
  
  // Check if process ID exists
  if (!processingStatusMap.has(processId)) {
    return NextResponse.json(
      { error: 'Process not found' },
      { status: 404 }
    );
  }
  
  // Get status data
  const statusData = processingStatusMap.get(processId)!;
  
  // Check if detailed history is requested
  const includeHistory = request.nextUrl.searchParams.get('includeHistory') === 'true';
  
  // Return status
  return NextResponse.json({
    status: statusData.status,
    warnings: statusData.warnings,
    lastUpdated: statusData.lastUpdated,
    ...(includeHistory ? { history: statusData.history } : {})
  });
}