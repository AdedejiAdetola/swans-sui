import { TransactionHelpers } from './transaction-helpers.js';
import { TEST_DATA } from '../config/constants.js';
import type { TestEnvironment } from './test-environment.js';

export class TestSetupHelpers {
  constructor(
    private testEnv: TestEnvironment,
    private txHelpers: TransactionHelpers
  ) {}

  async ensureRegistrySetup(): Promise<void> {
    if (!this.testEnv.registryId) {
      throw new Error('Registry ID not available. Check environment configuration.');
    }
  }

  async ensureBrandRegistered(): Promise<string> {
    // If brand already exists, return its ID
    if (this.testEnv.brandId) {
      return this.testEnv.brandId;
    }

    // Ensure registry is available
    await this.ensureRegistrySetup();

    try {
      // Register brand
      const brandTx = this.txHelpers.createRegisterBrandTx(
        this.testEnv.registryId!,
        TEST_DATA.BRAND.ID,
        TEST_DATA.BRAND.NAME,
        TEST_DATA.BRAND.LOGO_URL,
        TEST_DATA.BRAND.DESCRIPTION
      );

      const brandResult = await this.testEnv.executeTransaction(brandTx, this.testEnv.brandKeypair);
      const brandId = this.testEnv.findCreatedObjectByType(brandResult, 'Brand');

      if (!brandId) {
        throw new Error('Failed to create brand');
      }

      this.testEnv.brandId = brandId;

      // Fund the brand account
      const fundTx = this.txHelpers.createFundBrandTx(brandId, 50000);
      await this.testEnv.executeTransaction(fundTx, this.testEnv.brandKeypair);

      return brandId;
    } catch (error) {
      console.warn('Failed to register brand:', error);
      throw error;
    }
  }

  async ensureCreatorRegistered(): Promise<string> {
    // If creator already exists, return its ID
    if (this.testEnv.creatorId) {
      return this.testEnv.creatorId;
    }

    // Ensure registry is available
    await this.ensureRegistrySetup();

    try {
      // Register creator
      const creatorTx = this.txHelpers.createRegisterCreatorTx(
        this.testEnv.registryId!,
        TEST_DATA.CREATOR.ID,
        TEST_DATA.CREATOR.NAME,
        TEST_DATA.CREATOR.AVATAR_URL,
        TEST_DATA.CREATOR.CATEGORY,
        TEST_DATA.CREATOR.TWITTER,
        TEST_DATA.CREATOR.INSTAGRAM,
        TEST_DATA.CREATOR.TIKTOK,
        TEST_DATA.CREATOR.YOUTUBE
      );

      const creatorResult = await this.testEnv.executeTransaction(creatorTx, this.testEnv.creatorKeypair);
      const creatorId = this.testEnv.findCreatedObjectByType(creatorResult, 'Creator');

      if (!creatorId) {
        throw new Error('Failed to create creator');
      }

      this.testEnv.creatorId = creatorId;
      return creatorId;
    } catch (error) {
      console.warn('Failed to register creator:', error);
      throw error;
    }
  }

  async ensureCampaignCreated(): Promise<string> {
    // If campaign already exists, return its ID
    if (this.testEnv.campaignId) {
      return this.testEnv.campaignId;
    }

    // Ensure prerequisites exist
    await this.ensureBrandRegistered();

    try {
      // Create campaign
      const campaignTx = this.txHelpers.createCampaignTx(
        this.testEnv.registryId!,
        this.testEnv.brandId!,
        TEST_DATA.CAMPAIGN.ID,
        TEST_DATA.CAMPAIGN.TYPE,
        1000, // applicationStart
        2000, // applicationEnd
        3000, // campaignStart
        4000, // campaignEnd
        TEST_DATA.CAMPAIGN.BASE_PAY,
        TEST_DATA.CAMPAIGN.TOTAL_BUDGET,
        TEST_DATA.CAMPAIGN.CPM_RATES,
        TEST_DATA.CAMPAIGN.MAX_WINNERS
      );

      const campaignResult = await this.testEnv.executeTransaction(campaignTx, this.testEnv.brandKeypair);
      const campaignId = this.testEnv.findCreatedObjectByType(campaignResult, 'Campaign');

      if (!campaignId) {
        throw new Error('Failed to create campaign');
      }

      this.testEnv.campaignId = campaignId;
      return campaignId;
    } catch (error) {
      console.warn('Failed to create campaign:', error);
      throw error;
    }
  }

  async ensureCompleteSetup(): Promise<{
    registryId: string;
    brandId: string;
    creatorId: string;
    campaignId: string;
  }> {
    await this.ensureRegistrySetup();
    const brandId = await this.ensureBrandRegistered();
    const creatorId = await this.ensureCreatorRegistered();
    const campaignId = await this.ensureCampaignCreated();

    return {
      registryId: this.testEnv.registryId!,
      brandId,
      creatorId,
      campaignId,
    };
  }
}