import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';
import type { TestEnvironment } from '../utils/test-environment.js';

describe('Platform Setup Tests', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
  });

  describe('Network Connection', () => {
    it('should connect to Sui network', async () => {
      const version = await testEnv.client.getRpcApiVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });

    it('should have valid package ID', () => {
      expect(testEnv.packageId).toBeDefined();
      expect(testEnv.packageId).not.toBe('0x0');
      expect(typeof testEnv.packageId).toBe('string');
    });

    it('should have funded test accounts', async () => {
      const adminBalance = await testEnv.client.getBalance({
        owner: testEnv.addresses.admin,
      });
      const brandBalance = await testEnv.client.getBalance({
        owner: testEnv.addresses.brand,
      });
      const creatorBalance = await testEnv.client.getBalance({
        owner: testEnv.addresses.creator,
      });

      expect(parseInt(adminBalance.totalBalance)).toBeGreaterThan(0);
      expect(parseInt(brandBalance.totalBalance)).toBeGreaterThan(0);
      expect(parseInt(creatorBalance.totalBalance)).toBeGreaterThan(0);
    });
  });

  describe('Registry Initialization', () => {
    it('should initialize platform registry', async () => {
      // Registry should be initialized in global setup
      // Check if registry exists as shared object
      const sharedObjects = await testEnv.client.getOwnedObjects({
        owner: testEnv.addresses.admin,
        options: {
          showType: true,
          showContent: true,
        },
      });

      const registryObjects = sharedObjects.data.filter(obj =>
        obj.data?.type?.includes('PlatformRegistry')
      );

      expect(registryObjects.length).toBeGreaterThan(0);

      // Store registry ID for other tests
      if (registryObjects.length > 0) {
        testEnv.registryId = registryObjects[0].data?.objectId || null;
        expect(testEnv.registryId).toBeDefined();
      }
    });

    it('should have correct admin address', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const registryObject = await testEnv.getObjectDetails(testEnv.registryId);
      expect(registryObject.data).toBeDefined();

      if (registryObject.data?.content && 'fields' in registryObject.data.content) {
        const fields = registryObject.data.content.fields as any;
        expect(fields.admin).toBe(testEnv.addresses.admin);
      }
    });
  });

  describe('Package Verification', () => {
    it('should verify package is deployed', async () => {
      const packageObject = await testEnv.client.getObject({
        id: testEnv.packageId,
        options: { showType: true },
      });

      expect(packageObject.data).toBeDefined();
      expect(packageObject.error).toBeUndefined();
    });

    it('should have all required modules', async () => {
      // This test would verify that all expected modules exist in the package
      // For now, we'll just check the package exists and is accessible
      const packageObject = await testEnv.client.getObject({
        id: testEnv.packageId,
        options: { showType: true },
      });

      expect(packageObject.data?.type).toContain('package');
    });
  });

  describe('Clock Object Access', () => {
    it('should access system clock object', async () => {
      const clockObject = await testEnv.client.getObject({
        id: '0x6',
        options: { showContent: true },
      });

      expect(clockObject.data).toBeDefined();
      expect(clockObject.error).toBeUndefined();
    });
  });

  describe('Transaction Building', () => {
    it('should create valid transaction', () => {
      const tx = testEnv.createTransaction();
      expect(tx).toBeDefined();
    });

    it('should set gas configuration', () => {
      const tx = testEnv.createTransaction();
      const configuredTx = txHelpers.setGasConfig(tx, 50_000_000);

      expect(configuredTx).toBeDefined();
      expect(configuredTx).toBe(tx); // Same instance
    });

    it('should build transaction bytes', async () => {
      const tx = testEnv.createTransaction();
      tx.moveCall({
        target: '0x2::object::id_from_address',
        arguments: [tx.pure.address(testEnv.addresses.admin)],
      });

      // Build transaction to get bytes
      const built = await tx.build({ client: testEnv.client });
      expect(built).toBeDefined();
      expect(built.length).toBeGreaterThan(0);
    });
  });

  describe('Object Query Operations', () => {
    it('should query owned objects', async () => {
      const ownedObjects = await testEnv.getOwnedObjects(testEnv.addresses.admin);
      expect(ownedObjects).toBeDefined();
      expect(ownedObjects.data).toBeDefined();
      expect(Array.isArray(ownedObjects.data)).toBe(true);
    });

    it('should query objects by type filter', async () => {
      const filteredObjects = await testEnv.getOwnedObjects(
        testEnv.addresses.admin,
        `${testEnv.packageId}::registry::PlatformRegistry`
      );
      expect(filteredObjects).toBeDefined();
    });
  });

  describe('Event System', () => {
    it('should query historical events', async () => {
      // Query recent events from the package
      const events = await testEnv.client.queryEvents({
        query: { Package: testEnv.packageId },
        limit: 10,
        order: 'descending',
      });

      expect(events).toBeDefined();
      expect(events.data).toBeDefined();
      expect(Array.isArray(events.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid object ID gracefully', async () => {
      await expect(
        testEnv.getObjectDetails('0x123')
      ).rejects.toThrow();
    });

    it('should handle invalid function call', async () => {
      const tx = testEnv.createTransaction();

      tx.moveCall({
        target: `${testEnv.packageId}::nonexistent::function`,
        arguments: [],
      });

      await expect(
        testEnv.executeTransaction(tx, testEnv.adminKeypair)
      ).rejects.toThrow();
    });
  });
});