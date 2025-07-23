// Script to run email preview enhancement integration tests
const { execSync } = require('child_process');

try {
  console.log('Running Email Preview Enhancement Integration Tests...');
  execSync('npx vitest run src/tests/integration/email-preview-enhancement.test.ts --run', { stdio: 'inherit' });
  console.log('Integration tests completed successfully!');
} catch (error) {
  console.error('Integration tests failed:', error.message);
  process.exit(1);
}