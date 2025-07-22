/**
 * Test runner script for the comprehensive testing suite
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define test categories
const testCategories = [
  { name: 'Unit Tests', pattern: 'src/lib/**/__tests__/*.test.ts' },
  { name: 'Integration Tests', pattern: 'src/tests/integration/*.test.ts' },
  { name: 'API Tests', pattern: 'src/tests/api/*.test.ts' },
  { name: 'Error Scenario Tests', pattern: 'src/tests/error-scenarios/*.test.ts' }
];

// Parse command line arguments
const args = process.argv.slice(2);
const runUnitOnly = args.includes('--unit');
const runIntegrationOnly = args.includes('--integration');

// Function to run tests
function runTests(pattern, name) {
  console.log(`\n\n========== Running ${name} ==========\n`);
  try {
    execSync(`npx vitest run ${pattern} --reporter verbose`, { stdio: 'inherit' });
    console.log(`\n✅ ${name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${name} failed with error: ${error.message}`);
    return false;
  }
}

// Function to generate coverage report
function generateCoverageReport() {
  console.log('\n\n========== Generating Coverage Report ==========\n');
  try {
    execSync('npx vitest run --coverage', { stdio: 'inherit' });
    console.log('\n✅ Coverage report generated successfully');
    return true;
  } catch (error) {
    console.error(`\n❌ Coverage report generation failed: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting test suite...');
  
  let allTestsPassed = true;
  let categoriesToRun = testCategories;
  
  // Filter categories based on command line arguments
  if (runUnitOnly) {
    categoriesToRun = testCategories.filter(cat => cat.name === 'Unit Tests');
    console.log('Running unit tests only');
  } else if (runIntegrationOnly) {
    categoriesToRun = testCategories.filter(cat => cat.name === 'Integration Tests');
    console.log('Running integration tests only');
  } else {
    console.log('Running all test categories');
  }
  
  // Run each test category
  for (const category of categoriesToRun) {
    const success = runTests(category.pattern, category.name);
    if (!success) {
      allTestsPassed = false;
    }
  }
  
  // Generate coverage report if all tests passed and running all tests
  if (allTestsPassed && !runUnitOnly && !runIntegrationOnly) {
    generateCoverageReport();
  }
  
  // Print summary
  console.log('\n\n========== Test Summary ==========\n');
  if (allTestsPassed) {
    console.log('✅ All tests passed successfully');
  } else {
    console.log('❌ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});