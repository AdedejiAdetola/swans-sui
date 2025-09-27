import { Transaction } from '@mysten/sui/transactions'
import { PACKAGE_ID, REGISTRY_ID, FUNCTIONS, GAS_BUDGET } from './constants'

export interface TransactionOptions {
  gasBudget?: number
}

export class TransactionBuilder {
  static createRegisterBrandTx(
    brandId: string,
    brandName: string,
    profileImage: string,
    description: string,
    options: TransactionOptions = {}
  ): Transaction {
    if (!brandId || !brandName) {
      throw new Error('Brand ID and name are required')
    }

    const tx = new Transaction()

    // Set gas budget
    tx.setGasBudget(options.gasBudget || GAS_BUDGET.REGISTER_BRAND)

    tx.moveCall({
      target: FUNCTIONS.REGISTER_BRAND,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.pure.string(brandId),
        tx.pure.string(brandName),
        tx.pure.string(profileImage || ''),
        tx.pure.string(description || ''),
        tx.object('0x6') // Clock object
      ]
    })

    return tx
  }

  static createRegisterCreatorTx(
    creatorId: string,
    displayName: string,
    profileImage: string,
    category: string,
    twitterHandle: string,
    instagramHandle: string,
    tiktokHandle: string,
    youtubeHandle: string,
    options: TransactionOptions = {}
  ): Transaction {
    if (!creatorId || !displayName) {
      throw new Error('Creator ID and display name are required')
    }

    const tx = new Transaction()

    // Set gas budget
    tx.setGasBudget(options.gasBudget || GAS_BUDGET.REGISTER_CREATOR)

    tx.moveCall({
      target: FUNCTIONS.REGISTER_CREATOR,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.pure.string(creatorId),
        tx.pure.string(displayName),
        tx.pure.string(profileImage || ''),
        tx.pure.string(category),
        tx.pure.string(twitterHandle || ''),
        tx.pure.string(instagramHandle || ''),
        tx.pure.string(tiktokHandle || ''),
        tx.pure.string(youtubeHandle || ''),
        tx.object('0x6') // Clock object
      ]
    })

    return tx
  }

  static createCampaignTx(
    brandId: string,
    campaignId: string,
    title: string,
    description: string,
    budget: number,
    basePayment: number,
    applicationStart: number,
    applicationEnd: number,
    campaignStart: number,
    campaignEnd: number,
    maxParticipants: number,
    options: TransactionOptions = {}
  ): Transaction {
    if (!brandId || !campaignId || !title) {
      throw new Error('Brand ID, campaign ID, and title are required')
    }

    if (budget <= 0 || basePayment <= 0) {
      throw new Error('Budget and base payment must be positive numbers')
    }

    const tx = new Transaction()

    // Set gas budget
    tx.setGasBudget(options.gasBudget || GAS_BUDGET.CREATE_CAMPAIGN)

    // Match the Move function signature:
    // create_campaign(registry, brand, campaign_id, campaign_type, application_start, application_end,
    //                campaign_start, campaign_end, base_pay_per_creator, total_budget,
    //                cpm_likes, cpm_views, cpm_retweets, cpm_comments, cpm_link_clicks, max_winners, clock, ctx)
    tx.moveCall({
      target: FUNCTIONS.CREATE_CAMPAIGN,
      arguments: [
        tx.object(REGISTRY_ID),                    // registry: &mut PlatformRegistry
        tx.object(brandId),                        // brand: &mut Brand
        tx.pure.string(campaignId),                // campaign_id: String
        tx.pure.string(title),                     // campaign_type: String (using title as campaign type)
        tx.pure.u64(applicationStart),             // application_start: u64
        tx.pure.u64(applicationEnd),               // application_end: u64
        tx.pure.u64(campaignStart),                // campaign_start: u64
        tx.pure.u64(campaignEnd),                  // campaign_end: u64
        tx.pure.u64(basePayment),                  // base_pay_per_creator: u64
        tx.pure.u64(budget),                       // total_budget: u64
        tx.pure.u64(100),                          // cpm_likes: u64 (default value)
        tx.pure.u64(50),                           // cpm_views: u64 (default value)
        tx.pure.u64(200),                          // cpm_retweets: u64 (default value)
        tx.pure.u64(150),                          // cpm_comments: u64 (default value)
        tx.pure.u64(300),                          // cpm_link_clicks: u64 (default value)
        tx.pure.u64(maxParticipants),              // max_winners: u64
        tx.object('0x6'),                          // clock: &Clock
        // ctx is automatically added by the transaction system
      ]
    })

    return tx
  }

  static createApplyToCampaignTx(
    campaignId: string,
    creatorId: string,
    options: TransactionOptions = {}
  ): Transaction {
    if (!campaignId || !creatorId) {
      throw new Error('Campaign ID and creator ID are required')
    }

    const tx = new Transaction()

    // Set gas budget
    tx.setGasBudget(options.gasBudget || GAS_BUDGET.APPLY_TO_CAMPAIGN)

    // Match the Move function signature:
    // apply_to_campaign(campaign: &mut Campaign, creator: &Creator, clock: &Clock, ctx: &mut TxContext)
    tx.moveCall({
      target: FUNCTIONS.APPLY_TO_CAMPAIGN,
      arguments: [
        tx.object(campaignId),        // campaign: &mut Campaign
        tx.object(creatorId),         // creator: &Creator
        tx.object('0x6'),             // clock: &Clock
        // ctx is automatically added by the transaction system
      ]
    })

    return tx
  }

  static createSubmitContentTx(
    campaignId: string,
    creatorId: string,
    contentId: string,
    contentUrl: string,
    options: TransactionOptions = {}
  ): Transaction {
    if (!campaignId || !creatorId || !contentId || !contentUrl) {
      throw new Error('Campaign ID, creator ID, content ID, and content URL are required')
    }

    const tx = new Transaction()

    // Set gas budget
    tx.setGasBudget(options.gasBudget || GAS_BUDGET.SUBMIT_CONTENT)

    // Match the Move function signature:
    // submit_content(campaign: &mut Campaign, creator: &Creator, content_id: String, content_link: String, clock: &Clock, ctx: &mut TxContext)
    tx.moveCall({
      target: FUNCTIONS.SUBMIT_CONTENT,
      arguments: [
        tx.object(campaignId),        // campaign: &mut Campaign
        tx.object(creatorId),         // creator: &Creator
        tx.pure.string(contentId),    // content_id: String
        tx.pure.string(contentUrl),   // content_link: String
        tx.object('0x6'),             // clock: &Clock
        // ctx is automatically added by the transaction system
      ]
    })

    return tx
  }
}