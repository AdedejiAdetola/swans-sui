import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnvironment } from '../config/test-setup.js';
import { TransactionHelpers } from '../utils/transaction-helpers.js';
import { TestSetupHelpers } from '../utils/test-setup-helpers.js';
import { SuiAssertions } from '../utils/assertions.js';
import { TEST_DATA, TEST_TIMING } from '../config/constants.js';
import type { TestEnvironment } from '../utils/test-environment.js';

describe('Campaign Lifecycle Tests', () => {
  let testEnv: TestEnvironment;
  let txHelpers: TransactionHelpers;
  let setupHelpers: TestSetupHelpers;

  beforeAll(() => {
    testEnv = getTestEnvironment();
    txHelpers = new TransactionHelpers(testEnv);
    setupHelpers = new TestSetupHelpers(testEnv, txHelpers);
  });

  describe('Campaign Creation', () => {
    it('should create a new campaign successfully', async () => {
      // Ensure brand is registered and funded
      await setupHelpers.ensureBrandRegistered();

      const tx = txHelpers.createCampaignTx(
        testEnv.registryId,
        testEnv.brandId,
        TEST_DATA.CAMPAIGN.ID,
        TEST_DATA.CAMPAIGN.TYPE,
        TEST_TIMING.APPLICATION_START,
        TEST_TIMING.APPLICATION_END,
        TEST_TIMING.CAMPAIGN_START,
        TEST_TIMING.CAMPAIGN_END,
        TEST_DATA.CAMPAIGN.BASE_PAY,
        TEST_DATA.CAMPAIGN.TOTAL_BUDGET,
        TEST_DATA.CAMPAIGN.CPM_RATES,
        TEST_DATA.CAMPAIGN.MAX_WINNERS
      );

      const result = await testEnv.executeTransaction(tx, testEnv.brandKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasObjectChanges(result);
      SuiAssertions.hasEvents(result);

      // Find created Campaign object
      const campaignObjectId = testEnv.findCreatedObjectByType(result, 'Campaign');
      expect(campaignObjectId).toBeDefined();
      testEnv.campaignId = campaignObjectId;

      // Verify campaign creation event
      SuiAssertions.hasEventOfType(result, 'CampaignCreated');
      const campaignEvents = testEnv.extractEventsByType(result, 'CampaignCreated');
      expect(campaignEvents.length).toBe(1);

      const campaignEvent = campaignEvents[0];
      SuiAssertions.eventHasFields(campaignEvent, [
        'campaign_id',
        'brand_id',
        'total_budget',
        'base_pay',
        'timestamp'
      ]);

      expect(campaignEvent.parsedJson.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
      expect(campaignEvent.parsedJson.brand_id).toBe(TEST_DATA.BRAND.ID);
      expect(campaignEvent.parsedJson.total_budget).toBe(TEST_DATA.CAMPAIGN.TOTAL_BUDGET.toString());
      expect(campaignEvent.parsedJson.base_pay).toBe(TEST_DATA.CAMPAIGN.BASE_PAY.toString());
    });

    it('should verify campaign object properties', async () => {
      // Ensure campaign exists
      await setupHelpers.ensureCampaignCreated();

      const campaignObject = await testEnv.getObjectDetails(testEnv.campaignId);
      expect(campaignObject.data).toBeDefined();

      if (campaignObject.data?.content && 'fields' in campaignObject.data.content) {
        const campaign = campaignObject.data.content.fields as any;

        SuiAssertions.isValidCampaign(campaign, {
          campaign_id: TEST_DATA.CAMPAIGN.ID,
          brand_id: TEST_DATA.BRAND.ID,
          base_pay_per_creator: TEST_DATA.CAMPAIGN.BASE_PAY.toString(),
        });

        expect(campaign.brand_owner).toBe(testEnv.addresses.brand);
        expect(campaign.campaign_type).toBe(TEST_DATA.CAMPAIGN.TYPE);
        expect(parseInt(campaign.total_budget)).toBe(TEST_DATA.CAMPAIGN.TOTAL_BUDGET);

        // Verify timing configuration
        SuiAssertions.campaignHasValidTiming(campaign);
        expect(parseInt(campaign.application_start)).toBe(TEST_TIMING.APPLICATION_START);
        expect(parseInt(campaign.application_end)).toBe(TEST_TIMING.APPLICATION_END);
        expect(parseInt(campaign.campaign_start)).toBe(TEST_TIMING.CAMPAIGN_START);
        expect(parseInt(campaign.campaign_end)).toBe(TEST_TIMING.CAMPAIGN_END);

        // Verify CPM rates
        expect(campaign.cpm_rates).toBeDefined();
        expect(parseInt(campaign.cpm_rates.likes_cpm)).toBe(TEST_DATA.CAMPAIGN.CPM_RATES.LIKES);
        expect(parseInt(campaign.cmp_rates.views_cpm)).toBe(TEST_DATA.CAMPAIGN.CPM_RATES.VIEWS);
        expect(parseInt(campaign.cmp_rates.retweets_cpm)).toBe(TEST_DATA.CAMPAIGN.CPM_RATES.RETWEETS);
        expect(parseInt(campaign.cmp_rates.comments_cpm)).toBe(TEST_DATA.CAMPAIGN.CPM_RATES.COMMENTS);
        expect(parseInt(campaign.cmp_rates.link_clicks_cpm)).toBe(TEST_DATA.CAMPAIGN.CPM_RATES.LINK_CLICKS);

        // Verify initial state
        SuiAssertions.campaignIsActive(campaign);
        expect(parseInt(campaign.max_winners)).toBe(TEST_DATA.CAMPAIGN.MAX_WINNERS);
        expect(campaign.winners.length).toBe(0);
      }
    });

    it('should update brand campaign count', async () => {
      // Ensure brand and campaign exist
      await setupHelpers.ensureCampaignCreated();

      const brandObject = await testEnv.getObjectDetails(testEnv.brandId);
      if (brandObject.data?.content && 'fields' in brandObject.data.content) {
        const brand = brandObject.data.content.fields as any;
        expect(parseInt(brand.total_campaigns)).toBe(1);
      }
    });

    it('should fail to create campaign with invalid timing', async () => {
      if (!testEnv.registryId || !testEnv.brandId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createCampaignTx(
        testEnv.registryId,
        testEnv.brandId,
        'invalid_campaign',
        TEST_DATA.CAMPAIGN.TYPE,
        TEST_TIMING.APPLICATION_END, // Start after end - invalid
        TEST_TIMING.APPLICATION_START,
        TEST_TIMING.CAMPAIGN_START,
        TEST_TIMING.CAMPAIGN_END,
        TEST_DATA.CAMPAIGN.BASE_PAY,
        TEST_DATA.CAMPAIGN.TOTAL_BUDGET,
        TEST_DATA.CAMPAIGN.CPM_RATES,
        TEST_DATA.CAMPAIGN.MAX_WINNERS
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.brandKeypair)
      ).rejects.toThrow();
    });

    it('should fail to create campaign with insufficient budget', async () => {
      if (!testEnv.registryId || !testEnv.brandId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createCampaignTx(
        testEnv.registryId,
        testEnv.brandId,
        'underfunded_campaign',
        TEST_DATA.CAMPAIGN.TYPE,
        TEST_TIMING.APPLICATION_START,
        TEST_TIMING.APPLICATION_END,
        TEST_TIMING.CAMPAIGN_START,
        TEST_TIMING.CAMPAIGN_END,
        TEST_DATA.CAMPAIGN.BASE_PAY,
        100, // Insufficient budget
        TEST_DATA.CAMPAIGN.CPM_RATES,
        TEST_DATA.CAMPAIGN.MAX_WINNERS
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.brandKeypair)
      ).rejects.toThrow();
    });
  });

  describe('Creator Application Process', () => {
    it('should allow creator to apply to campaign', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met: Campaign and Creator required');
      }

      const tx = txHelpers.createApplyToCampaignTx(
        testEnv.campaignId,
        testEnv.creatorId,
        1500 // During application period
      );

      const result = await testEnv.executeTransaction(tx, testEnv.creatorKeypair);

      // Verify transaction succeeded
      SuiAssertions.transactionSucceeded(result);
      SuiAssertions.hasEvents(result);

      // Verify application event
      SuiAssertions.hasEventOfType(result, 'CampaignApplication');
      const applicationEvents = testEnv.extractEventsByType(result, 'CampaignApplication');
      expect(applicationEvents.length).toBe(1);

      const applicationEvent = applicationEvents[0];
      SuiAssertions.eventHasFields(applicationEvent, [
        'campaign_id',
        'creator_id',
        'creator_address',
        'timestamp'
      ]);

      expect(applicationEvent.parsedJson.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
      expect(applicationEvent.parsedJson.creator_id).toBe(TEST_DATA.CREATOR.ID);
      expect(applicationEvent.parsedJson.creator_address).toBe(testEnv.addresses.creator);
    });

    it('should prevent duplicate applications', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createApplyToCampaignTx(
        testEnv.campaignId,
        testEnv.creatorId,
        1600 // Still during application period
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.creatorKeypair)
      ).rejects.toThrow();
    });

    it('should prevent applications outside application period', async () => {
      if (!testEnv.campaignId || !testEnv.creatorId) {
        throw new Error('Prerequisites not met');
      }

      const tx = txHelpers.createApplyToCampaignTx(
        testEnv.campaignId,
        testEnv.creatorId,
        500 // Before application period
      );

      await expect(
        testEnv.executeTransaction(tx, testEnv.creatorKeypair)
      ).rejects.toThrow();
    });

    it('should verify campaign shows application', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      const campaignObject = await testEnv.getObjectDetails(testEnv.campaignId);
      if (campaignObject.data?.content && 'fields' in campaignObject.data.content) {
        const campaign = campaignObject.data.content.fields as any;

        // Verify applications table exists (we can't inspect contents directly)
        expect(campaign.applications).toBeDefined();
        expect(campaign.applications.fields).toBeDefined();
      }
    });
  });

  describe('Campaign State Management', () => {
    it('should query campaign by status', async () => {
      // Query all active campaigns
      const campaigns = await testEnv.client.getOwnedObjects({
        owner: testEnv.addresses.brand,
        filter: {
          StructType: `${testEnv.packageId}::campaign::Campaign`
        },
        options: {
          showContent: true,
          showType: true,
        }
      });

      expect(campaigns.data.length).toBeGreaterThan(0);

      // Find our test campaign
      const testCampaign = campaigns.data.find(obj => {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return fields.campaign_id === TEST_DATA.CAMPAIGN.ID;
        }
        return false;
      });

      expect(testCampaign).toBeDefined();
    });

    it('should track campaign budget consumption', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      const campaignObject = await testEnv.getObjectDetails(testEnv.campaignId);
      if (campaignObject.data?.content && 'fields' in campaignObject.data.content) {
        const campaign = campaignObject.data.content.fields as any;

        // Initially, escrow should have full budget
        expect(parseInt(campaign.escrow_balance)).toBe(TEST_DATA.CAMPAIGN.TOTAL_BUDGET);
      }
    });

    it('should support campaign time-based queries', async () => {
      // This would test querying campaigns by their timing states
      // In a real implementation, you might have helper functions to check if campaigns are:
      // - In application phase
      // - In active phase
      // - Completed

      const currentTime = Date.now();

      // Our test campaign should be in various phases based on the test timing
      expect(currentTime).toBeGreaterThan(TEST_TIMING.CAMPAIGN_END); // Campaign would be "completed" in real time
    });
  });

  describe('Campaign Query Operations', () => {
    it('should find campaigns by brand', async () => {
      const brandCampaigns = await testEnv.getOwnedObjects(
        testEnv.addresses.brand,
        `${testEnv.packageId}::campaign::Campaign`
      );

      expect(brandCampaigns.data.length).toBe(1); // Our test campaign
    });

    it('should query campaign details', async () => {
      if (!testEnv.campaignId) {
        throw new Error('Campaign not found');
      }

      const campaign = await testEnv.getObjectDetails(testEnv.campaignId);
      expect(campaign.data).toBeDefined();
      expect(campaign.error).toBeUndefined();

      if (campaign.data?.content && 'fields' in campaign.data.content) {
        const fields = campaign.data.content.fields as any;
        expect(fields.campaign_id).toBe(TEST_DATA.CAMPAIGN.ID);
        expect(fields.brand_id).toBe(TEST_DATA.BRAND.ID);
      }
    });

    it('should support filtering campaigns by criteria', async () => {
      // Query campaigns with specific budget range
      const allCampaigns = await testEnv.client.getOwnedObjects({
        owner: testEnv.addresses.brand,
        filter: {
          StructType: `${testEnv.packageId}::campaign::Campaign`
        },
        options: {
          showContent: true,
        }
      });

      const largeBudgetCampaigns = allCampaigns.data.filter(obj => {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return parseInt(fields.total_budget) >= 30000;
        }
        return false;
      });

      expect(largeBudgetCampaigns.length).toBe(1); // Our test campaign
    });
  });
});