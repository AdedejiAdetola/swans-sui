import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';
import { TEST_DATA } from '../config/constants.js';
import type { TestEnvironment } from '../utils/test-environment.js';

describe('Content Workflow Tests', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;
  let contentId: string | null = null;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
  });

  describe('Content Submission', () => {
    it('should allow creator to submit content', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met: Campaign and Creator required');
      }

      const tx = txHelpers.createSubmitContentTx(
        testEnv.campaignId,
        testEnv.creatorId,
        TEST_DATA.CONTENT.ID,
        TEST_DATA.CONTENT.LINK
      );

      const result = await testEnv.executeTransaction(tx, testEnv.creatorKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasObjectChanges(result);
      SuiAssertions.hasEvents(result);

      // Find created Content object
      const contentObjectId = testEnv.findCreatedObjectByType(result, 'Content');
      expect(contentObjectId).toBeDefined();
      contentId = contentObjectId;

      // Verify content submission event
      SuiAssertions.hasEventOfType(result, 'ContentSubmitted');
      const contentEvents = testEnv.extractEventsByType(result, 'ContentSubmitted');
      expect(contentEvents.length).toBe(1);

      const contentEvent = contentEvents[0];
      SuiAssertions.eventHasFields(contentEvent, [
        'campaign_id',
        'content_id',
        'creator_id',
        'content_link',
        'timestamp'
      ]);

      expect(contentEvent.parsedJson.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
      expect(contentEvent.parsedJson.content_id).toBe(TEST_DATA.CONTENT.ID);
      expect(contentEvent.parsedJson.creator_id).toBe(TEST_DATA.CREATOR.ID);
      expect(contentEvent.parsedJson.content_link).toBe(TEST_DATA.CONTENT.LINK);
    });

    it('should verify content object properties', async () => {
      if (!contentId) {
        throw new Error('Content not created');
      }

      const contentObject = await testEnv.getObjectDetails(contentId);
      expect(contentObject.data).toBeDefined();

      if (contentObject.data?.content && 'fields' in contentObject.data.content) {
        const content = contentObject.data.content.fields as any;

        SuiAssertions.isValidContent(content, {
          content_id: TEST_DATA.CONTENT.ID,
          campaign_id: TEST_DATA.CAMPAIGN.ID,
          creator_id: TEST_DATA.CREATOR.ID,
        });

        expect(content.content_link).toBe(TEST_DATA.CONTENT.LINK);
        expect(parseInt(content.status)).toBe(1); // Pending status
        expect(content.review_timestamp).toBeNull();
        expect(content.publish_timestamp).toBeNull();

        // Verify initial engagement metrics
        SuiAssertions.contentHasEngagementMetrics(content);
        expect(parseInt(content.engagement_metrics.likes_count)).toBe(0);
        expect(parseInt(content.engagement_metrics.views_count)).toBe(0);
        expect(parseInt(content.engagement_metrics.retweets_count)).toBe(0);
        expect(parseInt(content.engagement_metrics.comments_count)).toBe(0);
        expect(parseInt(content.engagement_metrics.link_clicks_count)).toBe(0);
      }
    });

    it('should prevent duplicate content submission', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createSubmitContentTx(
        testEnv.campaignId,
        testEnv.creatorId,
        TEST_DATA.CONTENT.ID, // Same content ID
        'https://different-link.com'
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.creatorKeypair)
      ).rejects.toThrow();
    });

    it('should fail submission from non-applied creator', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign required');
      }

      // Create a new creator that hasn't applied
      const newCreatorKeypair = testEnv.createOrLoadKeypair('NEW_CREATOR_KEY');

      const tx = txHelpers.createSubmitContentTx(
        testEnv.campaignId,
        'non_existent_creator_id',
        'new_content',
        TEST_DATA.CONTENT.LINK
      );

      await expect(
        testEnv.executeTransaction(tx, newCreatorKeypair)
      ).rejects.toThrow();
    });
  });

  describe('Content Review Process', () => {
    it('should allow brand to approve content', async () => {
      if (!testEnv.campaignId || !contentId) {
        throw new Error('Prerequisites not met: Campaign and Content required');
      }

      const tx = txHelpers.createReviewContentTx(
        testEnv.campaignId,
        contentId,
        true, // Approved
        'Great content! Approved for publication.'
      );

      const result = await testEnv.executeTransaction(tx, testEnv.brandKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasEvents(result);

      // Verify content review event
      SuiAssertions.hasEventOfType(result, 'ContentReviewed');
      const reviewEvents = testEnv.extractEventsByType(result, 'ContentReviewed');
      expect(reviewEvents.length).toBe(1);

      const reviewEvent = reviewEvents[0];
      SuiAssertions.eventHasFields(reviewEvent, [
        'campaign_id',
        'content_id',
        'approved',
        'reviewer',
        'timestamp'
      ]);

      expect(reviewEvent.parsedJson.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
      expect(reviewEvent.parsedJson.content_id).toBe(TEST_DATA.CONTENT.ID);
      expect(reviewEvent.parsedJson.approved).toBe(true);
      expect(reviewEvent.parsedJson.reviewer).toBe(testEnv.addresses.brand);
    });

    it('should verify content status updated to approved', async () => {
      if (!contentId) {
        throw new Error('Content not found');
      }

      const contentObject = await testEnv.getObjectDetails(contentId);
      if (contentObject.data?.content && 'fields' in contentObject.data.content) {
        const content = contentObject.data.content.fields as any;

        SuiAssertions.contentIsApproved(content);
        expect(content.review_timestamp).not.toBeNull();
      }
    });

    it('should allow brand to reject content', async () => {
      // First, create another content for rejection test
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      const submitTx = txHelpers.createSubmitContentTx(
        testEnv.campaignId,
        testEnv.creatorId,
        'reject_test_content',
        'https://test-reject.com/content'
      );

      const submitResult = await testEnv.executeTransaction(submitTx, testEnv.creatorKeypair);
      const rejectContentId = testEnv.findCreatedObjectByType(submitResult, 'Content');

      if (!rejectContentId) {
        throw new Error('Failed to create content for rejection test');
      }

      // Now reject the content
      const rejectTx = txHelpers.createReviewContentTx(
        testEnv.campaignId,
        rejectContentId,
        false, // Rejected
        'Content does not meet brand guidelines.'
      );

      const rejectResult = await testEnv.executeTransaction(rejectTx, testEnv.brandKeypair);

      SuiAssertions.transactionSucceeded(rejectResult);
      SuiAssertions.hasEventOfType(rejectResult, 'ContentReviewed');

      // Verify content status
      const rejectedContentObject = await testEnv.getObjectDetails(rejectContentId);
      if (rejectedContentObject.data?.content && 'fields' in rejectedContentObject.data.content) {
        const content = rejectedContentObject.data.content.fields as any;
        expect(parseInt(content.status)).toBe(2); // Rejected status
        expect(content.review_timestamp).not.toBeNull();
      }
    });

    it('should prevent non-brand from reviewing content', async () => {
      if (!testEnv.campaignId || !contentId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createReviewContentTx(
        testEnv.campaignId,
        contentId,
        true,
        'Unauthorized review'
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.creatorKeypair) // Creator trying to review
      ).rejects.toThrow();
    });
  });

  describe('Content Publication', () => {
    it('should allow creator to publish approved content', async () => {
      if (!testEnv.campaignId || !contentId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createPublishContentTx(
        testEnv.campaignId,
        contentId,
        testEnv.creatorId
      );

      const result = await testEnv.executeTransaction(tx, testEnv.creatorKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasEvents(result);

      // Should trigger base payment
      SuiAssertions.hasEventOfType(result, 'BasePaymentProcessed');
      const paymentEvents = testEnv.extractEventsByType(result, 'BasePaymentProcessed');
      expect(paymentEvents.length).toBe(1);

      const paymentEvent = paymentEvents[0];
      SuiAssertions.eventHasFields(paymentEvent, [
        'campaign_id',
        'creator_id',
        'amount',
        'timestamp'
      ]);

      expect(paymentEvent.parsedJson.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
      expect(paymentEvent.parsedJson.creator_id).toBe(TEST_DATA.CREATOR.ID);
      expect(paymentEvent.parsedJson.amount).toBe(TEST_DATA.CAMPAIGN.BASE_PAY.toString());
    });

    it('should verify content status updated to published', async () => {
      if (!contentId) {
        throw new Error('Content not found');
      }

      const contentObject = await testEnv.getObjectDetails(contentId);
      if (contentObject.data?.content && 'fields' in contentObject.data.content) {
        const content = contentObject.data.content.fields as any;

        SuiAssertions.contentIsPublished(content);
        expect(content.publish_timestamp).not.toBeNull();
      }
    });

    it('should update creator earnings', async () => {
      if (!testEnv.creatorId) {
        throw new Error('Creator not found');
      }

      const creatorObject = await testEnv.getObjectDetails(testEnv.creatorId);
      if (creatorObject.data?.content && 'fields' in creatorObject.data.content) {
        const creator = creatorObject.data.content.fields as any;
        expect(parseInt(creator.total_earnings)).toBe(TEST_DATA.CAMPAIGN.BASE_PAY);
        expect(parseInt(creator.total_campaigns)).toBe(1);
      }
    });

    it('should create payment receipt for creator', async () => {
      // Check for payment receipt in creator's owned objects
      const paymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      expect(paymentReceipts.data.length).toBeGreaterThan(0);

      // Verify the base payment receipt
      const receipt = paymentReceipts.data[0];
      if (receipt.data?.content && 'fields' in receipt.data.content) {
        const receiptFields = receipt.data.content.fields as any;

        SuiAssertions.isValidPaymentReceipt(receiptFields, {
          campaign_id: TEST_DATA.CAMPAIGN.ID,
          recipient_id: TEST_DATA.CREATOR.ID,
          amount: TEST_DATA.CAMPAIGN.BASE_PAY.toString(),
        });

        SuiAssertions.isBasePayment(receiptFields);
        expect(receiptFields.recipient_address).toBe(testEnv.addresses.creator);
      }
    });

    it('should prevent publishing non-approved content', async () => {
      // This would test trying to publish content that hasn't been approved
      // Since we already published our test content, we'd need another content item
      // in pending or rejected status for this test
    });
  });

  describe('Engagement Metrics Management', () => {
    it('should update engagement metrics', async () => {
      if (!testEnv.campaignId || !contentId) {
        throw new Error('Prerequisites not met');
      }

      const engagementData = {
        likes: 1000,
        views: 5000,
        retweets: 200,
        comments: 100,
        linkClicks: 50,
      };

      const tx = txHelpers.createProcessBonusPaymentTx(
        testEnv.campaignId,
        contentId,
        testEnv.creatorId!,
        engagementData
      );

      const result = await testEnv.executeTransaction(tx, testEnv.brandKeypair);

      SuiAssertions.transactionSucceeded(result);

      // Verify engagement metrics updated
      const contentObject = await testEnv.getObjectDetails(contentId);
      if (contentObject.data?.content && 'fields' in contentObject.data.content) {
        const content = contentObject.data.content.fields as any;

        expect(parseInt(content.engagement_metrics.likes_count)).toBe(engagementData.likes);
        expect(parseInt(content.engagement_metrics.views_count)).toBe(engagementData.views);
        expect(parseInt(content.engagement_metrics.retweets_count)).toBe(engagementData.retweets);
        expect(parseInt(content.engagement_metrics.comments_count)).toBe(engagementData.comments);
        expect(parseInt(content.engagement_metrics.link_clicks_count)).toBe(engagementData.linkClicks);
      }
    });

    it('should process bonus payment based on engagement', async () => {
      // Verify bonus payment event was emitted
      // The engagement update above should have triggered a bonus payment

      const bonusPaymentReceipts = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::payment::PaymentReceipt`
      );

      // Should now have both base payment and bonus payment
      expect(bonusPaymentReceipts.data.length).toBe(2);

      // Find the bonus payment receipt
      let bonusReceipt;
      for (const receipt of bonusPaymentReceipts.data) {
        if (receipt.data?.content && 'fields' in receipt.data.content) {
          const fields = receipt.data.content.fields as any;
          if (parseInt(fields.payment_type) === 1) { // Bonus payment
            bonusReceipt = fields;
            break;
          }
        }
      }

      expect(bonusReceipt).toBeDefined();
      if (bonusReceipt) {
        SuiAssertions.isBonusPayment(bonusReceipt);
        expect(parseInt(bonusReceipt.amount)).toBeGreaterThan(0);
      }
    });
  });

  describe('Content Query Operations', () => {
    it('should query content by campaign', async () => {
      const creatorContents = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::content::Content`
      );

      expect(creatorContents.data.length).toBeGreaterThan(0);

      // Filter by campaign ID
      const campaignContents = creatorContents.data.filter(obj => {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return fields.campaign_id === TEST_DATA.CAMPAIGN.ID;
        }
        return false;
      });

      expect(campaignContents.length).toBeGreaterThan(0);
    });

    it('should query content by status', async () => {
      const creatorContents = await testEnv.getOwnedObjects(
        testEnv.addresses.creator,
        `${testEnv.packageId}::content::Content`
      );

      // Find published content
      const publishedContent = creatorContents.data.filter(obj => {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return parseInt(fields.status) === 4; // Published status
        }
        return false;
      });

      expect(publishedContent.length).toBeGreaterThan(0);
    });

    it('should calculate total engagement across content', async () => {
      if (!contentId) {
        throw new Error('Content not found');
      }

      const contentObject = await testEnv.getObjectDetails(contentId);
      if (contentObject.data?.content && 'fields' in contentObject.data.content) {
        const content = contentObject.data.content.fields as any;
        const metrics = content.engagement_metrics;

        const totalEngagement =
          parseInt(metrics.likes_count) +
          parseInt(metrics.views_count) +
          parseInt(metrics.retweets_count) +
          parseInt(metrics.comments_count) +
          parseInt(metrics.link_clicks_count);

        expect(totalEngagement).toBeGreaterThan(0);
        expect(totalEngagement).toBe(6350); // Sum of our test engagement data
      }
    });
  });
});