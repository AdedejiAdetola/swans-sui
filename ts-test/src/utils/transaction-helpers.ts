import { Transaction } from '@mysten/sui/transactions';
import { TestEnvironment } from './test-environment.js';
import { MODULES, TEST_DATA, GAS_SETTINGS } from '../config/constants.js';

export class TransactionHelpers {
  constructor(private testEnv: TestEnvironment) {}

  // Registry Operations - Skip since registry is already deployed
  createInitializeRegistryTx(): Transaction {
    // Registry is already deployed, so this is mainly for reference
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.REGISTRY}::init_for_testing`,
      arguments: [],
    });

    return tx;
  }

  // Brand Operations
  createRegisterBrandTx(
    registryId: string,
    brandId: string = TEST_DATA.BRAND.ID,
    brandName: string = TEST_DATA.BRAND.NAME,
    logoUrl: string = TEST_DATA.BRAND.LOGO_URL,
    description: string = TEST_DATA.BRAND.DESCRIPTION
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.BRAND}::register_brand`,
      arguments: [
        tx.object(registryId),
        tx.pure.string(brandId),
        tx.pure.string(brandName),
        tx.pure.string(logoUrl),
        tx.pure.string(description),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  createFundBrandTx(brandObjectId: string, amount: number = 50000): Transaction {
    const tx = this.testEnv.createTransaction();

    // Create USDC coins for testing using the standard coin module
    // Note: USDC type is defined in the brand module
    const [coin] = tx.moveCall({
      target: `0x2::coin::mint_for_testing`,
      typeArguments: [`${this.testEnv.packageId}::${MODULES.BRAND}::USDC`],
      arguments: [tx.pure.u64(amount)],
    });

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.BRAND}::fund_brand_account`,
      arguments: [
        tx.object(brandObjectId),
        coin,
      ],
    });

    return tx;
  }

  // Creator Operations
  createRegisterCreatorTx(
    registryId: string,
    creatorId: string = TEST_DATA.CREATOR.ID,
    name: string = TEST_DATA.CREATOR.NAME,
    avatarUrl: string = TEST_DATA.CREATOR.AVATAR_URL,
    category: string = TEST_DATA.CREATOR.CATEGORY,
    twitter: string = TEST_DATA.CREATOR.TWITTER,
    instagram: string = TEST_DATA.CREATOR.INSTAGRAM,
    tiktok: string = TEST_DATA.CREATOR.TIKTOK,
    youtube: string = TEST_DATA.CREATOR.YOUTUBE
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CREATOR}::register_creator`,
      arguments: [
        tx.object(registryId),
        tx.pure.string(creatorId),
        tx.pure.string(name),
        tx.pure.string(avatarUrl),
        tx.pure.string(category),
        tx.pure.string(twitter),
        tx.pure.string(instagram),
        tx.pure.string(tiktok),
        tx.pure.string(youtube),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  // Campaign Operations
  createCampaignTx(
    registryId: string,
    brandObjectId: string,
    campaignId: string = TEST_DATA.CAMPAIGN.ID,
    campaignType: string = TEST_DATA.CAMPAIGN.TYPE,
    applicationStart: number = 1000,
    applicationEnd: number = 2000,
    campaignStart: number = 3000,
    campaignEnd: number = 4000,
    basePay: number = TEST_DATA.CAMPAIGN.BASE_PAY,
    totalBudget: number = TEST_DATA.CAMPAIGN.TOTAL_BUDGET,
    cpmRates = TEST_DATA.CAMPAIGN.CPM_RATES,
    maxWinners: number = TEST_DATA.CAMPAIGN.MAX_WINNERS
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CAMPAIGN}::create_campaign`,
      arguments: [
        tx.object(registryId),
        tx.object(brandObjectId),
        tx.pure.string(campaignId),
        tx.pure.string(campaignType),
        tx.pure.u64(applicationStart),
        tx.pure.u64(applicationEnd),
        tx.pure.u64(campaignStart),
        tx.pure.u64(campaignEnd),
        tx.pure.u64(basePay),
        tx.pure.u64(totalBudget),
        tx.pure.u64(cpmRates.LIKES),
        tx.pure.u64(cpmRates.VIEWS),
        tx.pure.u64(cpmRates.RETWEETS),
        tx.pure.u64(cpmRates.COMMENTS),
        tx.pure.u64(cpmRates.LINK_CLICKS),
        tx.pure.u64(maxWinners),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  createApplyToCampaignTx(
    campaignId: string,
    creatorObjectId: string,
    clockTimestamp: number = 1500 // During application period
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    // Create a test clock with specific timestamp
    const [testClock] = tx.moveCall({
      target: `0x2::clock::create_for_testing`,
      arguments: [],
    });

    tx.moveCall({
      target: `0x2::clock::set_for_testing`,
      arguments: [
        testClock,
        tx.pure.u64(clockTimestamp),
      ],
    });

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CAMPAIGN}::apply_to_campaign`,
      arguments: [
        tx.object(campaignId),
        tx.object(creatorObjectId),
        testClock,
      ],
    });

    // Destroy the test clock
    tx.moveCall({
      target: `0x2::clock::destroy_for_testing`,
      arguments: [testClock],
    });

    return tx;
  }

  // Content Operations
  createSubmitContentTx(
    campaignId: string,
    creatorObjectId: string,
    contentId: string = TEST_DATA.CONTENT.ID,
    contentLink: string = TEST_DATA.CONTENT.LINK
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CONTENT}::submit_content`,
      arguments: [
        tx.object(campaignId),
        tx.object(creatorObjectId),
        tx.pure.string(contentId),
        tx.pure.string(contentLink),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  createReviewContentTx(
    campaignId: string,
    contentObjectId: string,
    approved: boolean = true,
    feedback: string = 'Approved for testing'
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CONTENT}::review_content`,
      arguments: [
        tx.object(campaignId),
        tx.object(contentObjectId),
        tx.pure.bool(approved),
        tx.pure.string(feedback),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  createPublishContentTx(
    campaignId: string,
    contentObjectId: string,
    creatorObjectId: string
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CONTENT}::publish_content`,
      arguments: [
        tx.object(campaignId),
        tx.object(contentObjectId),
        tx.object(creatorObjectId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  // Payment Operations
  createProcessBonusPaymentTx(
    campaignId: string,
    contentObjectId: string,
    creatorObjectId: string,
    engagementMetrics: {
      likes: number;
      views: number;
      retweets: number;
      comments: number;
      linkClicks: number;
    }
  ): Transaction {
    const tx = this.testEnv.createTransaction();

    // First update engagement metrics
    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CONTENT}::update_engagement_metrics`,
      arguments: [
        tx.object(campaignId),
        tx.object(contentObjectId),
        tx.pure.u64(engagementMetrics.likes),
        tx.pure.u64(engagementMetrics.views),
        tx.pure.u64(engagementMetrics.retweets),
        tx.pure.u64(engagementMetrics.comments),
        tx.pure.u64(engagementMetrics.linkClicks),
      ],
    });

    // Then process bonus payment
    tx.moveCall({
      target: `${this.testEnv.packageId}::${MODULES.CONTENT}::process_bonus_payment`,
      arguments: [
        tx.object(campaignId),
        tx.object(contentObjectId),
        tx.object(creatorObjectId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  // Utility Methods
  setGasConfig(tx: Transaction, budget?: number, price?: number): Transaction {
    if (budget) {
      tx.setGasBudget(budget);
    } else {
      tx.setGasBudget(GAS_SETTINGS.DEFAULT_BUDGET);
    }

    if (price) {
      tx.setGasPrice(price);
    }

    return tx;
  }
}