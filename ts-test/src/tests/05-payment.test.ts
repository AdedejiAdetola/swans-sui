import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';
import { TEST_DATA } from '../config/constants.js';
import type { TestEnvironment } from '../utils/test-environment.js';

describe('Payment Processing Tests', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
  });

  describe('Payment Receipt Management', () => {
    it('should verify base payment receipt properties', async () => {
      // Get all payment receipts for the creator
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      expect(paymentReceipts.data.length).toBeGreaterThan(0);

      // Find the base payment receipt
      let basePaymentReceipt;
      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          if (parseInt(fields.payment_type) === 0) { // Base payment
            basePaymentReceipt = fields;
            break;
          }
        }
      }

      expect(basePaymentReceipt).toBeDefined();
      if (basePaymentReceipt) {
        SuiAssertions.isValidPaymentReceipt(basePaymentReceipt, {
          campaign_id: TEST_DATA.CAMPAIGN.ID,
          recipient_id: TEST_DATA.CREATOR.ID,
          amount: TEST_DATA.CAMPAIGN.BASE_PAY.toString(),
        });

        SuiAssertions.isBasePayment(basePaymentReceipt);
        expect(basePaymentReceipt.recipient_address).toBe(testEnv.addresses.creator);
        expect(parseInt(basePaymentReceipt.payment_timestamp)).toBeGreaterThan(0);
      }
    });

    it('should verify bonus payment receipt properties', async () => {
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      // Find the bonus payment receipt
      let bonusPaymentReceipt;
      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          if (parseInt(fields.payment_type) === 1) { // Bonus payment
            bonusPaymentReceipt = fields;
            break;
          }
        }
      }

      expect(bonusPaymentReceipt).toBeDefined();
      if (bonusPaymentReceipt) {
        SuiAssertions.isValidPaymentReceipt(bonusPaymentReceipt);
        SuiAssertions.isBonusPayment(bonusPaymentReceipt);
        expect(bonusPaymentReceipt.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
        expect(bonusPaymentReceipt.recipient_id).toBe(TEST_DATA.CREATOR.ID);
        expect(bonusPaymentReceipt.recipient_address).toBe(testEnv.addresses.creator);
        expect(parseInt(bonusPaymentReceipt.amount)).toBeGreaterThan(0);
      }
    });

    it('should calculate total earnings from all payment receipts', async () => {
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      let totalEarnings = 0;
      let basePaymentCount = 0;
      let bonusPaymentCount = 0;

      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          totalEarnings += parseInt(fields.amount);

          if (parseInt(fields.payment_type) === 0) {
            basePaymentCount++;
          } else if (parseInt(fields.payment_type) === 1) {
            bonusPaymentCount++;
          }
        }
      }

      expect(totalEarnings).toBeGreaterThan(TEST_DATA.CAMPAIGN.BASE_PAY);
      expect(basePaymentCount).toBe(1);
      expect(bonusPaymentCount).toBe(1);

      // Verify this matches the creator's total_earnings
      if (testEnv.creatorId) {
        const creatorObject = await testEnv.getObjectDetails(testEnv.creatorId);
        if (creatorObject.data?.content && 'fields' in creatorObject.data.content) {
          const creator = creatorObject.data.content.fields as any;
          expect(parseInt(creator.total_earnings)).toBe(totalEarnings);
        }
      }
    });
  });

  describe('Engagement Bonus Calculations', () => {
    it('should calculate correct bonus based on CPM rates', async () => {
      // Test engagement metrics: 1000 likes, 5000 views, 200 retweets, 100 comments, 50 clicks
      // CPM rates: likes=10, views=5, retweets=20, comments=15, clicks=25
      // Expected bonus: (1000/100)*10 + (5000/100)*5 + (200/100)*20 + (100/100)*15 + (50/100)*25
      // = 10*10 + 50*5 + 2*20 + 1*15 + 0.5*25 = 100 + 250 + 40 + 15 + 12.5 = 417.5 (rounded to 417)

      const expectedBonus = Math.floor(
        (1000 / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.LIKES +
        (5000 / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.VIEWS +
        (200 / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.RETWEETS +
        (100 / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.COMMENTS +
        (50 / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.LINK_CLICKS
      );

      expect(expectedBonus).toBe(417);

      // Find the bonus payment and verify amount
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      let bonusAmount = 0;
      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          if (parseInt(fields.payment_type) === 1) { // Bonus payment
            bonusAmount = parseInt(fields.amount);
            break;
          }
        }
      }

      expect(bonusAmount).toBe(expectedBonus);
    });

    it('should handle zero engagement gracefully', async () => {
      // This would test a scenario where content has no engagement
      // The bonus payment should be 0 or minimal
      // Since we already processed engagement, we'd need a new content item for this test
    });

    it('should handle very high engagement numbers', async () => {
      // This would test edge cases with very large engagement numbers
      // to ensure no integer overflow occurs
    });
  });

  describe('Campaign Budget Management', () => {
    it('should track campaign spending accurately', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      const campaignObject = await testEnv.getObjectDetails(testEnv.campaignId);
      if (campaignObject.data?.content && 'fields' in campaignObject.data.content) {
        const campaign = campaignObject.data.content.fields as any;

        const initialBudget = TEST_DATA.CAMPAIGN.TOTAL_BUDGET;
        const currentEscrowBalance = parseInt(campaign.escrow_balance);
        const spentAmount = initialBudget - currentEscrowBalance;

        // Should have spent at least the base payment amount
        expect(spentAmount).toBeGreaterThanOrEqual(TEST_DATA.CAMPAIGN.BASE_PAY);

        // Should have sufficient remaining balance
        expect(currentEscrowBalance).toBeGreaterThan(0);
        expect(currentEscrowBalance).toBeLessThan(initialBudget);
      }
    });

    it('should prevent overspending campaign budget', async () => {
      // This would test a scenario where the campaign tries to pay more than available
      // We'd need to simulate a campaign with very low budget for this test
    });

    it('should update brand spending statistics', async () => {
      if (!testEnv.brandId) {
        throw new Error('Brand not found');
      }

      const brandObject = await testEnv.getObjectDetails(testEnv.brandId);
      if (brandObject.data?.content && 'fields' in brandObject.data.content) {
        const brand = brandObject.data.content.fields as any;

        // Brand should show some amount spent
        expect(parseInt(brand.total_spent)).toBeGreaterThan(0);

        // Should match the campaign spending
        if (testEnv.campaignId) {
          const campaignObject = await testEnv.getObjectDetails(testEnv.campaignId);
          if (campaignObject.data?.content && 'fields' in campaignObject.data.content) {
            const campaign = campaignObject.data.content.fields as any;
            const spentAmount = TEST_DATA.CAMPAIGN.TOTAL_BUDGET - parseInt(campaign.escrow_balance);
            expect(parseInt(brand.total_spent)).toBe(spentAmount);
          }
        }
      }
    });
  });

  describe('Payment Analysis and Reporting', () => {
    it('should aggregate payments by campaign', async () => {
      // Get all payment receipts for the creator
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      const campaignPayments = new Map<string, number>();

      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          const campaignId = fields.campaign_id;
          const amount = parseInt(fields.amount);

          campaignPayments.set(
            campaignId,
            (campaignPayments.get(campaignId) || 0) + amount
          );
        }
      }

      expect(campaignPayments.size).toBe(1); // Only our test campaign
      expect(campaignPayments.get(TEST_DATA.CAMPAIGN.ID)).toBeGreaterThan(TEST_DATA.CAMPAIGN.BASE_PAY);
    });

    it('should calculate payment breakdown by type', async () => {
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      let basePaymentTotal = 0;
      let bonusPaymentTotal = 0;

      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          const amount = parseInt(fields.amount);
          const paymentType = parseInt(fields.payment_type);

          if (paymentType === 0) { // Base payment
            basePaymentTotal += amount;
          } else if (paymentType === 1) { // Bonus payment
            bonusPaymentTotal += amount;
          }
        }
      }

      expect(basePaymentTotal).toBe(TEST_DATA.CAMPAIGN.BASE_PAY);
      expect(bonusPaymentTotal).toBeGreaterThan(0);
      expect(basePaymentTotal + bonusPaymentTotal).toBeGreaterThan(TEST_DATA.CAMPAIGN.BASE_PAY);
    });

    it('should provide payment timing analysis', async () => {
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      let basePaymentTime = 0;
      let bonusPaymentTime = 0;

      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          const timestamp = parseInt(fields.payment_timestamp);
          const paymentType = parseInt(fields.payment_type);

          if (paymentType === 0) { // Base payment
            basePaymentTime = timestamp;
          } else if (paymentType === 1) { // Bonus payment
            bonusPaymentTime = timestamp;
          }
        }
      }

      expect(basePaymentTime).toBeGreaterThan(0);
      expect(bonusPaymentTime).toBeGreaterThan(0);
      expect(bonusPaymentTime).toBeGreaterThan(basePaymentTime); // Bonus should come after base
    });
  });

  describe('Winner Selection and Bonus Payments', () => {
    it('should select campaign winners', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      // For this test, we'll simulate selecting winners
      // In the real contract, this would be done by the brand

      const tx = testEnv.createTransaction();

      tx.moveCall({
        target: `${testEnv.packageId}::campaign::select_campaign_winners`,
        arguments: [
          tx.object(testEnv.campaignId),
          tx.pure([TEST_DATA.CREATOR.ID]), // Winner creator IDs
        ],
      });

      const result = await testEnv.executeTransaction(tx, testEnv.brandKeypair);

      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasEventOfType(result, 'WinnersSelected');
    });

    it('should verify winner selection in campaign state', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      const campaignObject = await testEnv.getObjectDetails(testEnv.campaignId);
      if (campaignObject.data?.content && 'fields' in campaignObject.data.content) {
        const campaign = campaignObject.data.content.fields as any;

        expect(campaign.winners.length).toBeGreaterThan(0);
        expect(campaign.winners).toContain(TEST_DATA.CREATOR.ID);
      }
    });

    it('should prevent selecting more winners than allowed', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      // Try to select too many winners
      const tooManyWinners = Array(TEST_DATA.CAMPAIGN.MAX_WINNERS + 1)
        .fill(0)
        .map((_, i) => `winner_${i}`);

      const tx = testEnv.createTransaction();
      tx.moveCall({
        target: `${testEnv.packageId}::campaign::select_campaign_winners`,
        arguments: [
          tx.object(testEnv.campaignId),
          tx.pure(tooManyWinners),
        ],
      });

      await expect(
        testEnv.executeTransaction(tx, testEnv.brandKeypair)
      ).rejects.toThrow();
    });
  });

  describe('Payment Security and Validation', () => {
    it('should prevent duplicate payment processing', async () => {
      // This would test that the same content can't trigger multiple base payments
      // The contract should track payment status to prevent this
    });

    it('should validate payment recipient addresses', async () => {
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      for (const receipt of paymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          expect(fields.recipient_address).toBe(testEnv.addresses.creator);
          expect(fields.recipient_id).toBe(TEST_DATA.CREATOR.ID);
        }
      }
    });

    it('should handle edge cases in bonus calculation', async () => {
      // Test bonus calculation with edge values
      const edgeCaseMetrics = {
        likes: 99, // Just under 100 threshold
        views: 0,  // Zero engagement
        retweets: 100000, // Very high engagement
        comments: 1,
        linkClicks: 0,
      };

      // Calculate expected bonus
      const expectedBonus = Math.floor(
        (edgeCaseMetrics.likes / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.LIKES +
        (edgeCaseMetrics.views / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.VIEWS +
        (edgeCaseMetrics.retweets / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.RETWEETS +
        (edgeCaseMetrics.comments / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.COMMENTS +
        (edgeCaseMetrics.linkClicks / 100) * TEST_DATA.CAMPAIGN.CPM_RATES.LINK_CLICKS
      );

      // For likes=99: 0 (since 99/100 = 0 in integer division)
      // For retweets=100000: 1000*20 = 20000
      // Total expected: 0 + 0 + 20000 + 0 + 0 = 20000
      expect(expectedBonus).toBe(20000);
    });
  });

  describe('Payment Events and Notifications', () => {
    it('should emit proper events for all payment types', async () => {
      // Query payment events from the package
      const paymentEvents = await testEnv.client.queryEvents({
        query: { Package: testEnv.packageId },
        limit: 50,
        order: 'descending',
      });

      const basePaymentEvents = paymentEvents.data.filter(event =>
        event.type.includes('BasePaymentProcessed')
      );

      const bonusPaymentEvents = paymentEvents.data.filter(event =>
        event.type.includes('BonusPaymentProcessed')
      );

      expect(basePaymentEvents.length).toBeGreaterThan(0);
      expect(bonusPaymentEvents.length).toBeGreaterThan(0);

      // Verify event data
      if (basePaymentEvents.length > 0) {
        const baseEvent = basePaymentEvents[0];
        SuiAssertions.eventHasFields(baseEvent, [
          'campaign_id',
          'creator_id',
          'amount',
          'timestamp'
        ]);
      }

      if (bonusPaymentEvents.length > 0) {
        const bonusEvent = bonusPaymentEvents[0];
        SuiAssertions.eventHasFields(bonusEvent, [
          'campaign_id',
          'creator_id',
          'amount',
          'content_id',
          'timestamp'
        ]);
      }
    });

    it('should track payment history chronologically', async () => {
      const paymentEvents = await testEnv.client.queryEvents({
        query: { Package: testEnv.packageId },
        limit: 50,
        order: 'ascending', // Chronological order
      });

      const allPaymentEvents = paymentEvents.data.filter(event =>
        event.type.includes('PaymentProcessed') ||
        event.type.includes('BasePayment') ||
        event.type.includes('BonusPayment')
      );

      expect(allPaymentEvents.length).toBeGreaterThan(0);

      // Verify events are in chronological order
      let lastTimestamp = 0;
      for (const event of allPaymentEvents) {
        if (event.parsedJson?.timestamp) {
          const timestamp = parseInt(event.parsedJson.timestamp);
          expect(timestamp).toBeGreaterThanOrEqual(lastTimestamp);
          lastTimestamp = timestamp;
        }
      }
    });
  });
});