import { config } from 'dotenv';
import { beforeAll, afterAll } from 'vitest';
import { TestEnvironment } from '../utils/test-environment.js';

// Load environment variables
config();

// Global test environment instance
let testEnv: TestEnvironment;

// Global setup for all tests
beforeAll(async () => {
  console.log('🚀 Setting up test environment...');

  testEnv = new TestEnvironment();
  await testEnv.initialize();

  // Make test environment available globally
  (globalThis as any).__TEST_ENV__ = testEnv;

  console.log('✅ Test environment ready');
}, 30000);

// Global cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  if (testEnv) {
    await testEnv.cleanup();
  }

  console.log('✅ Cleanup complete');
}, 30000);

// Export for direct access in tests
export const getTestEnvironment = (): TestEnvironment => {
  return (globalThis as any).__TEST_ENV__;
};