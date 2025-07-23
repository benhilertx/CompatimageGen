# Email Preview Enhancement Integration Tests

This document describes the integration tests for the Email Preview Enhancement feature.

## Overview

The integration tests verify that the HTML preview and platform information features work correctly across the entire application flow. These tests ensure that:

1. HTML previews are generated correctly for different file types (SVG, PNG, JPEG)
2. Platform information modal displays correct details about email clients
3. The feature maintains backward compatibility with existing code
4. The UI is responsive across different screen sizes

## Test Structure

The tests are organized into the following categories:

### Complete Preview Workflow with Different File Types

Tests the end-to-end workflow from file processing to preview generation for different file types:

- SVG files: Verifies that SVG files are processed correctly and HTML previews are generated with appropriate fallbacks (SVG for Apple Mail, VML for Outlook, PNG for Gmail)
- PNG files: Verifies that PNG files are processed correctly and HTML previews use PNG fallbacks for all clients
- JPEG files: Verifies that JPEG files are processed correctly and HTML previews use PNG fallbacks for all clients

### HTML Preview Rendering

Tests the HTML preview rendering component:

- Verifies that HTML previews render correctly with client-specific styles
- Tests error handling for invalid HTML content

### Platform Info Modal Integration

Tests the platform information modal:

- Verifies that the modal opens when the info icon is clicked
- Checks that platform details are displayed correctly
- Ensures that the modal can be closed

### Backward Compatibility

Tests compatibility with existing code:

- Verifies that the PreviewComponent works with older preview data format (without HTML preview content)
- Ensures that fallback and quality information is still displayed correctly

### Responsive Layout

Tests responsive behavior:

- Verifies that the layout adapts to different screen sizes
- Checks that components render correctly on both desktop and mobile screens

## Running the Tests

To run the integration tests:

```bash
node src/tests/integration/run-email-preview-tests.js
```

Or use the Vitest CLI directly:

```bash
npx vitest run src/tests/integration/email-preview-enhancement.test.ts --run
```

## Test Coverage

These integration tests cover:

- Service integration: FileProcessingService, PreviewGeneratorService, PlatformDetailsService
- Component integration: PreviewComponent, HTMLPreviewRenderer, PlatformInfoModal
- Cross-component interactions: Opening modals, displaying previews
- Responsive behavior across different screen sizes
- Backward compatibility with existing code

## Future Improvements

Potential improvements to the test suite:

- Add more edge cases for different file types and sizes
- Test with real HTML content to verify rendering accuracy
- Add performance tests for large files or many previews
- Test keyboard navigation and accessibility features