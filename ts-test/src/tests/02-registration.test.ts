import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';
import { TEST_DATA } from '../config/constants.js';
import type { TestEnvironment } from '../utils/test-environment.js';

describe('Brand and Creator Registration Tests', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
  });

  describe('Brand Registration', () => {
    it('should register a new brand successfully', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const tx = txHelpers.createRegisterBrandTx(
        testEnv.registryId,
        TEST_DATA.BRAND.ID,
        TEST_DATA.BRAND.NAME,
        TEST_DATA.BRAND.LOGO_URL,
        TEST_DATA.BRAND.DESCRIPTION
      );

      const result = await testEnv.executeTransaction(tx, testEnv.brandKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasObjectChanges(result);
      SuiAssertions.hasEvents(result);

      // Find created Brand object
      const brandObjectId = testEnv.findCreatedObjectByType(result, 'Brand');
      expect(brandObjectId).toBeDefined();
      testEnv.brandId = brandObjectId;

      // Verify brand registration event
      SuiAssertions.hasEventOfType(result, 'BrandRegistered');
      const brandEvents = testEnv.extractEventsByType(result, 'BrandRegistered');
      expect(brandEvents.length).toBe(1);

      const brandEvent = brandEvents[0];
      SuiAssertions.eventHasFields(brandEvent, [
        'brand_id',
        'brand_name',
        'brand_address',
        'timestamp'
      ]);

      expect(brandEvent.parsedJson.brand_id).toBe(TEST_DATA.BRAND.ID);
      expect(brandEvent.parsedJson.brand_name).toBe(TEST_DATA.BRAND.NAME);
      expect(brandEvent.parsedJson.brand_address).toBe(testEnv.addresses.brand);
    });

    it('should verify brand object properties', async () => {
      if (!testEnv.brandId) {
        throw new Error('Brand not registered');
      }

      const brandObject = await testEnv.getObjectDetails(testEnv.brandId);
      expect(brandObject.data).toBeDefined();

      if (brandObject.data?.content && 'fields' in brandObject.data.content) {
        const brand = brandObject.data.content.fields as any;

        SuiAssertions.isValidBrand(brand, {
          brand_id: TEST_DATA.BRAND.ID,
          brand_name: TEST_DATA.BRAND.NAME,
        });

        expect(brand.token_wallet).toBe(testEnv.addresses.brand);
        expect(brand.logo_url).toBe(TEST_DATA.BRAND.LOGO_URL);
        expect(brand.description).toBe(TEST_DATA.BRAND.DESCRIPTION);
        expect(parseInt(brand.reputation)).toBe(5000); // Default reputation
        expect(parseInt(brand.balance)).toBe(0); // Initially unfunded
        expect(parseInt(brand.total_campaigns)).toBe(0);
        expect(parseInt(brand.total_spent)).toBe(0);
      }
    });

    it('should fund brand account', async () => {
      if (!testEnv.brandId) {
        throw new Error('Brand not registered');
      }

      const fundingAmount = 50000;
      const tx = txHelpers.createFundBrandTx(testEnv.brandId, fundingAmount);

      const result = await testEnv.executeTransaction(tx, testEnv.brandKeypair);

      SuiAssertions.transactionSucceeded(result);

      // Verify brand balance updated
      const brandObject = await testEnv.getObjectDetails(testEnv.brandId);
      if (brandObject.data?.content && 'fields' in brandObject.data.content) {
        const brand = brandObject.data.content.fields as any;
        SuiAssertions.balanceEquals(brand.balance, fundingAmount);
      }
    });

    it('should fail to register brand with duplicate ID', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const tx = txHelpers.createRegisterBrandTx(
        testEnv.registryId,
        TEST_DATA.BRAND.ID, // Same ID as before
        'Duplicate Brand',
        TEST_DATA.BRAND.LOGO_URL,
        TEST_DATA.BRAND.DESCRIPTION
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.brandKeypair)
      ).rejects.toThrow();
    });
  });

  describe('Creator Registration', () => {
    it('should register a new creator successfully', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const tx = txHelpers.createRegisterCreatorTx(
        testEnv.registryId,
        TEST_DATA.CREATOR.ID,
        TEST_DATA.CREATOR.NAME,
        TEST_DATA.CREATOR.AVATAR_URL,
        TEST_DATA.CREATOR.CATEGORY,
        TEST_DATA.CREATOR.TWITTER,
        TEST_DATA.CREATOR.INSTAGRAM,
        TEST_DATA.CREATOR.TIKTOK,
        TEST_DATA.CREATOR.YOUTUBE
      );

      const result = await testEnv.executeTransaction(tx, testEnv.creatorKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasObjectChanges(result);
      SuiAssertions.hasEvents(result);

      // Find created Creator object
      const creatorObjectId = testEnv.findCreatedObjectByType(result, 'Creator');
      expect(creatorObjectId).toBeDefined();
      testEnv.creatorId = creatorObjectId;

      // Verify creator registration event
      SuiAssertions.hasEventOfType(result, 'CreatorRegistered');
      const creatorEvents = testEnv.extractEventsByType(result, 'CreatorRegistered');
      expect(creatorEvents.length).toBe(1);

      const creatorEvent = creatorEvents[0];
      SuiAssertions.eventHasFields(creatorEvent, [
        'creator_id',
        'creator_name',
        'creator_address',
        'category',
        'timestamp'
      ]);

      expect(creatorEvent.parsedJson.creator_id).toBe(TEST_DATA.CREATOR.ID);
      expect(creatorEvent.parsedJson.creator_name).toBe(TEST_DATA.CREATOR.NAME);
      expect(creatorEvent.parsedJson.creator_address).toBe(testEnv.addresses.creator);
      expect(creatorEvent.parsedJson.category).toBe(TEST_DATA.CREATOR.CATEGORY);
    });

    it('should verify creator object properties', async () => {
      if (!testEnv.creatorId) {
        throw new Error('Creator not registered');
      }

      const creatorObject = await testEnv.getObjectDetails(testEnv.creatorId);
      expect(creatorObject.data).toBeDefined();

      if (creatorObject.data?.content && 'fields' in creatorObject.data.content) {
        const creator = creatorObject.data.content.fields as any;

        SuiAssertions.isValidCreator(creator, {
          creator_id: TEST_DATA.CREATOR.ID,
          name: TEST_DATA.CREATOR.NAME,
          category: TEST_DATA.CREATOR.CATEGORY,
        });

        expect(creator.token_wallet).toBe(testEnv.addresses.creator);
        expect(creator.avatar_url).toBe(TEST_DATA.CREATOR.AVATAR_URL);
        expect(parseInt(creator.reputation)).toBe(5000); // Default reputation
        expect(parseInt(creator.total_earnings)).toBe(0);
        expect(parseInt(creator.total_campaigns)).toBe(0);

        // Verify social handles
        SuiAssertions.creatorHasValidSocialHandles(creator);
        expect(creator.social_handles.twitter).toBe(TEST_DATA.CREATOR.TWITTER);
        expect(creator.social_handles.instagram).toBe(TEST_DATA.CREATOR.INSTAGRAM);
        expect(creator.social_handles.tiktok).toBe(TEST_DATA.CREATOR.TIKTOK);
        expect(creator.social_handles.youtube).toBe(TEST_DATA.CREATOR.YOUTUBE);
      }
    });

    it('should fail to register creator with duplicate ID', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const tx = txHelpers.createRegisterCreatorTx(
        testEnv.registryId,
        TEST_DATA.CREATOR.ID, // Same ID as before
        'Duplicate Creator',
        TEST_DATA.CREATOR.AVATAR_URL,
        TEST_DATA.CREATOR.CATEGORY,
        TEST_DATA.CREATOR.TWITTER,
        TEST_DATA.CREATOR.INSTAGRAM,
        TEST_DATA.CREATOR.TIKTOK,
        TEST_DATA.CREATOR.YOUTUBE
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.creatorKeypair)
      ).rejects.toThrow();
    });

    it('should fail to register creator with invalid category', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const tx = txHelpers.createRegisterCreatorTx(
        testEnv.registryId,
        'invalid_creator',
        'Invalid Creator',
        TEST_DATA.CREATOR.AVATAR_URL,
        'invalid_category', // Invalid category
        TEST_DATA.CREATOR.TWITTER,
        TEST_DATA.CREATOR.INSTAGRAM,
        TEST_DATA.CREATOR.TIKTOK,
        TEST_DATA.CREATOR.YOUTUBE
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.creatorKeypair)
      ).rejects.toThrow();
    });
  });

  describe('Registry State Verification', () => {
    it('should update registry with registered brand and creator', async () => {
      if (!testEnv.registryId) {
        throw new Error('Registry not initialized');
      }

      const registryObject = await testEnv.getObjectDetails(testEnv.registryId);
      expect(registryObject.data).toBeDefined();

      if (registryObject.data?.content && 'fields' in registryObject.data.content) {
        const registry = registryObject.data.content.fields as any;

        // Verify that brands and creators tables are not empty
        expect(registry.brands).toBeDefined();
        expect(registry.creators).toBeDefined();

        // Note: We can't directly inspect table contents without additional queries
        // but we know they should contain our registered brand and creator
      }
    });

    it('should be able to query registered entities', async () => {
      // Query all Brand objects owned by brand address
      const brandObjects = await testEnv.getOwnedObjects(
        testEnv.addresses.brand,
        `${testEnv.packageId}::brand::Brand`
      );

      expect(brandObjects.data.length).toBeGreaterThan(0);

      // Query all Creator objects owned by creator address
      const creatorObjects = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::creator::Creator`
      );

      expect(creatorObjects.data.length).toBeGreaterThan(0);
    });
  });
});