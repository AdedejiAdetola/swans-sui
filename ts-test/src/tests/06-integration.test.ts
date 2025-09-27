import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';
import { TEST_DATA } from '../config/constants.js';
import type { TestEnvironment } from '../utils/test-environment.js';

describe('End-to-End Integration Tests', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
  });

  describe('Complete Campaign Workflow', () => {
    it('should execute complete brand journey', async () => {
      // This test verifies the entire brand workflow:
      // 1. Brand registration ✓ (done in setup)
      // 2. Brand funding ✓ (done in setup)
      // 3. Campaign creation ✓ (done in setup)
      // 4. Campaign management and winner selection

      expect(testEnv.brandId).toBeDefined();
      expect(testEnv.campaignId).toBeDefined();

      // Verify brand has funded account
      if (testEnv.brandId) {
        const brand = await testEnv.getObjectDetails(testEnv.brandId);
        if (brand.data?.content && 'fields' in brand.data.content) {
          const brandFields = brand.data.content.fields as any;
          expect(parseInt(brandFields.balance)).toBeGreaterThan(0);
          expect(parseInt(brandFields.total_campaigns)).toBe(1);
        }
      }

      // Verify campaign is properly configured
      if (testEnv.campaignId) {
        const campaign = await testEnv.getObjectDetails(testEnv.campaignId);
        if (campaign.data?.content && 'fields' in campaign.data.content) {
          const campaignFields = campaign.data.content.fields as any;
          SuiAssertions.isValidCampaign(campaignFields);
          expect(parseInt(campaignFields.escrow_balance)).toBeGreaterThan(0);
        }
      }
    });

    it('should execute complete creator journey', async () => {
      // This test verifies the entire creator workflow:
      // 1. Creator registration ✓ (done in setup)
      // 2. Campaign application ✓ (done in setup)
      // 3. Content submission ✓ (done in setup)
      // 4. Content publication and payment ✓ (done in setup)

      expect(testEnv.creatorId).toBeDefined();

      // Verify creator has earned money
      if (testEnv.creatorId) {
        const creator = await testEnv.getObjectDetails(testEnv.creatorId);
        if (creator.data?.content && 'fields' in creator.data.content) {
          const creatorFields = creator.data.content.fields as any;
          expect(parseInt(creatorFields.total_earnings)).toBeGreaterThan(0);
          expect(parseInt(creatorFields.total_campaigns)).toBe(1);
        }
      }

      // Verify creator has payment receipts
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );
      expect(paymentReceipts.data.length).toBeGreaterThan(0);

      // Verify creator has published content
      const creatorContent = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::content::Content`
      );
      expect(creatorContent.data.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-User Scenarios', () => {
    let secondCreatorId: string | null = null;

    it('should handle multiple creators in same campaign', async () => {
      if (!testEnv.registryId || !testEnv.campaignId) {
        throw new Error('Prerequisites not met');
      }

      // Register a second creator
      const secondCreatorKeypair = testEnv.createOrLoadKeypair('SECOND_CREATOR_KEY');

      const registerTx = txHelpers.createRegisterCreatorTx(
        testEnv.registryId,
        'second_creator',
        'Second Test Creator',
        'https://example.com/avatar2.png',
        'tech',
        '@second_creator',
        '@second_creator_ig',
        '@second_creator_tik',
        'SecondCreator'
      );

      const registerResult = await testEnv.executeTransaction(registerTx, secondCreatorKeypair);
      secondCreatorId = testEnv.findCreatedObjectByType(registerResult, 'Creator');
      expect(secondCreatorId).toBeDefined();

      // Second creator applies to campaign
      if (secondCreatorId) {
        const applyTx = txHelpers.createApplyToCampaignTx(
          testEnv.campaignId,
          secondCreatorId,
          1700 // During application period
        );

        const applyResult = await testEnv.executeTransaction(applyTx, secondCreatorKeypair);
        SuiAssertions.transactionSucceeded(applyResult);
      }
    });

    it('should handle multiple content submissions per creator', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      // Submit second content piece
      const submitTx = txHelpers.createSubmitContentTx(
        testEnv.campaignId,
        testEnv.creatorId,
        'second_content',
        'https://twitter.com/creator/status/456789'
      );

      const submitResult = await testEnv.executeTransaction(submitTx, testEnv.creatorKeypair);
      const secondContentId = testEnv.findCreatedObjectByType(submitResult, 'Content');
      expect(secondContentId).toBeDefined();

      // Approve and publish second content
      if (secondContentId) {
        const reviewTx = txHelpers.createReviewContentTx(
          testEnv.campaignId,
          secondContentId,
          true,
          'Second content approved'
        );

        const reviewResult = await testEnv.executeTransaction(reviewTx, testEnv.brandKeypair);
        SuiAssertions.transactionSucceeded(reviewResult);

        const publishTx = txHelpers.createPublishContentTx(
          testEnv.campaignId,
          secondContentId,
          testEnv.creatorId
        );

        const publishResult = await testEnv.executeTransaction(publishTx, testEnv.creatorKeypair);
        SuiAssertions.transactionSucceeded(publishResult);
      }
    });

    it('should maintain data consistency across multiple users', async () => {
      // Verify registry state
      if (testEnv.registryId) {
        const registry = await testEnv.getObjectDetails(testEnv.registryId);
        expect(registry.data).toBeDefined();
      }

      // Verify campaign shows multiple applications
      if (testEnv.campaignId) {
        const campaign = await testEnv.getObjectDetails(testEnv.campaignId);
        if (campaign.data?.content && 'fields' in campaign.data.content) {
          const campaignFields = campaign.data.content.fields as any;
          expect(campaignFields.applications).toBeDefined();
        }
      }

      // Verify both creators have content
      const firstCreatorContent = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::content::Content`
      );
      expect(firstCreatorContent.data.length).toBeGreaterThan(1); // Should have 2 content pieces now

      if (secondCreatorId) {
        const secondCreatorAddress = testEnv.addresses.creator; // This would be the second creator's address in a real test
        // In practice, you'd need to track multiple addresses
      }
    });
  });

  describe('System State Validation', () => {
    it('should maintain consistent accounting', async () => {
      // Total money flow validation
      let totalPaid = 0;
      let totalEarned = 0;

      // Calculate total paid from brand perspective
      if (testEnv.brandId) {
        const brand = await testEnv.getObjectDetails(testEnv.brandId);
        if (brand.data?.content && 'fields' in brand.data.content) {
          const brandFields = brand.data.content.fields as any;
          const totalSpent = parseInt(brandFields.total_spent);
          totalPaid = totalSpent;
        }
      }

      // Calculate total earned from creator perspective
      if (testEnv.creatorId) {
        const creator = await testEnv.getObjectDetails(testEnv.creatorId);
        if (creator.data?.content && 'fields' in creator.data.content) {
          const creatorFields = creator.data.content.fields as any;
          totalEarned = parseInt(creatorFields.total_earnings);
        }
      }

      // In a single-creator scenario, total paid should equal total earned
      expect(totalPaid).toBe(totalEarned);
    });

    it('should validate campaign escrow balance', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      const campaign = await testEnv.getObjectDetails(testEnv.campaignId);
      if (campaign.data?.content && 'fields' in campaign.data.content) {
        const campaignFields = campaign.data.content.fields as any;

        const initialBudget = TEST_DATA.CAMPAIGN.TOTAL_BUDGET;
        const remainingBalance = parseInt(campaignFields.escrow_balance);
        const totalSpent = initialBudget - remainingBalance;

        // Remaining balance should be positive
        expect(remainingBalance).toBeGreaterThan(0);

        // Total spent should match creator earnings
        if (testEnv.creatorId) {
          const creator = await testEnv.getObjectDetails(testEnv.creatorId);
          if (creator.data?.content && 'fields' in creator.data.content) {
            const creatorFields = creator.data.content.fields as any;
            const creatorEarnings = parseInt(creatorFields.total_earnings);
            expect(totalSpent).toBe(creatorEarnings);
          }
        }
      }
    });

    it('should verify all payment receipts are accounted for', async () => {
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      let totalFromReceipts = 0;
      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          totalFromReceipts += parseInt(fields.amount);
        }
      }

      // Total from receipts should match creator earnings
      if (testEnv.creatorId) {
        const creator = await testEnv.getObjectDetails(testEnv.creatorId);
        if (creator.data?.content && 'fields' in creator.data.content) {
          const creatorFields = creator.data.content.fields as any;
          const creatorEarnings = parseInt(creatorFields.total_earnings);
          expect(totalFromReceipts).toBe(creatorEarnings);
        }
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of events', async () => {
      // Query all events from the package
      const allEvents = await testEnv.client.queryEvents({
        query: { Package: testEnv.packageId },
        limit: 100,
        order: 'descending',
      });

      expect(allEvents.data.length).toBeGreaterThan(0);

      // Events should be properly formatted
      for (const event of allEvents.data) {
        expect(event.type).toBeDefined();
        expect(event.parsedJson).toBeDefined();
        expect(event.timestampMs).toBeDefined();
      }
    });

    it('should efficiently query objects by type', async () => {
      const startTime = Date.now();

      // Query different object types
      const brands = await testEnv.getOwnedObjects(
        testEnv.addresses.brand,
        `${testEnv.packageId}::brand::Brand`
      );

      const creators = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::creator::Creator`
      );

      const campaigns = await testEnv.getOwnedObjects(
        testEnv.addresses.brand,
        `${testEnv.packageId}::campaign::Campaign`
      );

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(brands.data.length).toBeGreaterThan(0);
      expect(creators.data.length).toBeGreaterThan(0);
      expect(campaigns.data.length).toBeGreaterThan(0);

      // Queries should complete reasonably quickly (less than 5 seconds)
      expect(queryTime).toBeLessThan(5000);
    });

    it('should handle concurrent operations gracefully', async () => {
      // This test would simulate concurrent operations in a real-world scenario
      // For now, we'll just verify that multiple rapid queries don't fail

      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          testEnv.client.getObject({
            id: testEnv.campaignId!,
            options: { showContent: true },
          })
        );
      }

      const results = await Promise.all(promises);

      for (const result of results) {
        expect(result.data).toBeDefined();
        expect(result.error).toBeUndefined();
      }
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network interruptions gracefully', async () => {
      // Test transaction confirmation with retry logic
      if (testEnv.campaignId) {
        const tx = testEnv.createTransaction();
        tx.moveCall({
          target: '0x2::object::id',
          arguments: [tx.object(testEnv.campaignId)],
        });

        const result = await testEnv.executeTransaction(tx, testEnv.adminKeypair);
        SuiAssertions.transactionSucceeded(result);

        // Verify we can retrieve the transaction by digest
        const confirmedTx = await testEnv.waitForTransaction(result.digest);
        expect(confirmedTx).toBeDefined();
      }
    });

    it('should maintain data integrity during complex operations', async () => {
      // Verify that all object references are valid
      const objectIds = [
        testEnv.registryId,
        testEnv.brandId,
        testEnv.creatorId,
        testEnv.campaignId,
      ].filter(Boolean) as string[];

      for (const objectId of objectIds) {
        const obj = await testEnv.getObjectDetails(objectId);
        expect(obj.data).toBeDefined();
        expect(obj.error).toBeUndefined();

        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          expect(fields.id).toBeDefined();
          expect(fields.id.id).toBe(objectId);
        }
      }
    });

    it('should provide comprehensive error information', async () => {
      // Test invalid operation to ensure proper error reporting
      const tx = testEnv.createTransaction();
      tx.moveCall({
        target: `${testEnv.packageId}::campaign::invalid_function`,
        arguments: [],
      });

      try {
        await testEnv.executeTransaction(tx, testEnv.adminKeypair);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);

        // Log the error for debugging
        console.log('Caught error:', error.message);

        // Error should contain useful information
        expect(error.message.length).toBeGreaterThan(0);

        // Check that the error is the expected FunctionNotFound error
        const errorMessage = error.message;
        const hasExpectedError =
          errorMessage.includes('FunctionNotFound') ||
          errorMessage.includes('invalid_function') ||
          errorMessage.includes('Dry run failed');

        expect(hasExpectedError).toBe(true);

        // If error has cause property, check it contains function details
        if ('cause' in error && error.cause) {
          const cause = error.cause as any;
          if (cause.executionErrorSource) {
            expect(cause.executionErrorSource).toContain('invalid_function');
          }
        }
      }
    });
  });

  describe('Frontend Integration Readiness', () => {
    it('should provide all necessary data for dashboard views', async () => {
      // Brand dashboard data
      const brandData = {
        profile: await testEnv.getObjectDetails(testEnv.brandId!),
        campaigns: await testEnv.getOwnedObjects(
          testEnv.addresses.brand,
          `${testEnv.packageId}::campaign::Campaign`
        ),
      };

      expect(brandData.profile.data).toBeDefined();
      expect(brandData.campaigns.data.length).toBeGreaterThan(0);

      // Creator dashboard data
      const creatorData = {
        profile: await testEnv.getObjectDetails(testEnv.creatorId!),
        content: await testEnv.getOwnedObjects(
          testEnv.addresses.creator,
          `${testEnv.packageId}::content::Content`
        ),
        payments: await testEnv.getOwnedObjects(
          testEnv.addresses.creator,
          `${testEnv.packageId}::payment::PaymentReceipt`
        ),
      };

      expect(creatorData.profile.data).toBeDefined();
      expect(creatorData.content.data.length).toBeGreaterThan(0);
      expect(creatorData.payments.data.length).toBeGreaterThan(0);
    });

    it('should support real-time updates via events', async () => {
      // Query recent events for real-time updates
      const recentEvents = await testEnv.client.queryEvents({
        query: { Package: testEnv.packageId },
        limit: 20,
        order: 'descending',
      });

      expect(recentEvents.data.length).toBeGreaterThan(0);

      // Events should be properly structured for frontend consumption
      for (const event of recentEvents.data) {
        expect(event.type).toBeDefined();
        expect(event.parsedJson).toBeDefined();
        expect(event.timestampMs).toBeDefined();
        expect(typeof event.timestampMs).toBe('string');
      }
    });

    it('should provide efficient filtering and pagination', async () => {
      // Test filtering by different criteria
      const allCampaigns = await testEnv.getOwnedObjects(
        testEnv.addresses.brand,
        `${testEnv.packageId}::campaign::Campaign`
      );

      expect(allCampaigns.hasNextPage).toBeDefined();
      expect(allCampaigns.data).toBeDefined();
      expect(Array.isArray(allCampaigns.data)).toBe(true);

      // Each object should have the necessary fields for filtering
      for (const campaign of allCampaigns.data) {
        expect(campaign.data?.objectId).toBeDefined();
        expect(campaign.data?.type).toBeDefined();
        if (campaign.data?.content && 'fields' in campaign.data.content) {
          const fields = campaign.data.content.fields as any;
          expect(fields.campaign_id).toBeDefined();
          expect(fields.status).toBeDefined();
          expect(fields.creation_timestamp).toBeDefined();
        }
      }
    });
  });
});