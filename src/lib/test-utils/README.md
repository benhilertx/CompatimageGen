# CompatimageGen Testing Suite

This directory contains utilities and helpers for testing the CompatimageGen application.

## Overview

The testing suite is designed to validate all aspects of the application, including:

- Unit tests for individual services and utilities
- Integration tests for API endpoints
- Error handling and edge cases
- File processing workflows

## Test Structure

The tests are organized as follows:

- **Unit Tests**: Located in `__tests__` directories alongside the code they test
- **Integration Tests**: Located in `__tests__` directories with `.integration.test.ts` naming
- **Test Utilities**: Located in `src/lib/test-utils/`

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Utilities

The `test-setup.ts` file provides common utilities for testing:

- `createMockFile()`: Creates a mock File object for testing file uploads
- `createMockBuffer()`: Creates a mock Buffer for testing file processing
- `createMockFileData()`: Creates mock file data objects
- `testSvgs`: Sample SVG strings for testing SVG processing
- Mock classes for FormData, Response, etc.
- Mock functions for external dependencies like sharp, svgo, and jszip

## Writing Tests

When writing new tests, follow these guidelines:

1. Place unit tests in a `__tests__` directory next to the code being tested
2. Name unit test files with the pattern `*.test.ts`
3. Name integration test files with the pattern `*.integration.test.ts`
4. Use the test utilities from `test-setup.ts` for consistent mocking
5. Test both success and error scenarios
6. Mock external dependencies to avoid side effects

## Test Coverage

The test suite aims to achieve high coverage across all components:

- Services: SVG processing, image processing, VML generation, HTML template generation
- Utilities: File validation, file cleanup
- API endpoints: Upload, process, status, preview, download
- Error handling: Invalid inputs, file system errors, processing failures

## Continuous Integration

Tests are automatically run as part of the CI/CD pipeline to ensure code quality and prevent regressions.