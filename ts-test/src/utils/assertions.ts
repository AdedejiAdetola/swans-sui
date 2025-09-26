import { expect } from 'vitest';
import type { Brand, Creator, Campaign, Content, PaymentReceipt } from '../types/sui-objects.js';

export class SuiAssertions {
  // Generic object assertions
  static hasValidObjectId(obj: any): void {
    expect(obj).toBeDefined();
    expect(obj.id).toBeDefined();
    expect(obj.id.id).toBeDefined();
    expect(typeof obj.id.id).toBe('string');
    expect(obj.id.id.length).toBeGreaterThan(0);
  }

  // Brand assertions
  static isValidBrand(brand: Brand, expectedData?: Partial<Brand>): void {
    this.hasValidObjectId(brand);
    expect(brand.brand_id).toBeDefined();
    expect(brand.brand_name).toBeDefined();
    expect(brand.token_wallet).toBeDefined();
    expect(brand.creation_timestamp).toBeDefined();

    if (expectedData) {
      if (expectedData.brand_id) {
        expect(brand.brand_id).toBe(expectedData.brand_id);
      }
      if (expectedData.brand_name) {
        expect(brand.brand_name).toBe(expectedData.brand_name);
      }
    }
  }

  static brandHasSufficientBalance(brand: Brand, minBalance: number): void {
    const balance = parseInt(brand.balance);
    expect(balance).toBeGreaterThanOrEqual(minBalance);
  }

  // Creator assertions
  static isValidCreator(creator: Creator, expectedData?: Partial<Creator>): void {
    this.hasValidObjectId(creator);
    expect(creator.creator_id).toBeDefined();
    expect(creator.name).toBeDefined();
    expect(creator.token_wallet).toBeDefined();
    expect(creator.category).toBeDefined();
    expect(creator.social_handles).toBeDefined();
    expect(creator.creation_timestamp).toBeDefined();

    if (expectedData) {
      if (expectedData.creator_id) {
        expect(creator.creator_id).toBe(expectedData.creator_id);
      }
      if (expectedData.name) {
        expect(creator.name).toBe(expectedData.name);
      }
      if (expectedData.category) {
        expect(creator.category).toBe(expectedData.category);
      }
    }
  }

  static creatorHasValidSocialHandles(creator: Creator): void {
    expect(creator.social_handles).toBeDefined();
    expect(creator.social_handles.twitter).toBeDefined();
    expect(creator.social_handles.instagram).toBeDefined();
    expect(creator.social_handles.tiktok).toBeDefined();
    expect(creator.social_handles.youtube).toBeDefined();
  }

  // Campaign assertions
  static isValidCampaign(campaign: Campaign, expectedData?: Partial<Campaign>): void {
    this.hasValidObjectId(campaign);
    expect(campaign.campaign_id).toBeDefined();
    expect(campaign.brand_id).toBeDefined();
    expect(campaign.brand_owner).toBeDefined();
    expect(campaign.application_start).toBeDefined();
    expect(campaign.application_end).toBeDefined();
    expect(campaign.campaign_start).toBeDefined();
    expect(campaign.campaign_end).toBeDefined();
    expect(campaign.base_pay_per_creator).toBeDefined();
    expect(campaign.total_budget).toBeDefined();
    expect(campaign.status).toBeDefined();
    expect(campaign.cpm_rates).toBeDefined();

    if (expectedData) {
      if (expectedData.campaign_id) {
        expect(campaign.campaign_id).toBe(expectedData.campaign_id);
      }
      if (expectedData.brand_id) {
        expect(campaign.brand_id).toBe(expectedData.brand_id);
      }
      if (expectedData.base_pay_per_creator) {
        expect(campaign.base_pay_per_creator).toBe(expectedData.base_pay_per_creator);
      }
    }
  }

  static campaignHasValidTiming(campaign: Campaign): void {
    const appStart = parseInt(campaign.application_start);
    const appEnd = parseInt(campaign.application_end);
    const campStart = parseInt(campaign.campaign_start);
    const campEnd = parseInt(campaign.campaign_end);

    expect(appStart).toBeLessThan(appEnd);
    expect(appEnd).toBeLessThanOrEqual(campStart);
    expect(campStart).toBeLessThan(campEnd);
  }

  static campaignHasValidCpmRates(campaign: Campaign): void {
    expect(campaign.cmp_rates).toBeDefined();
    expect(parseInt(campaign.cmp_rates.likes_cpm)).toBeGreaterThan(0);
    expect(parseInt(campaign.cmp_rates.views_cpm)).toBeGreaterThan(0);
    expect(parseInt(campaign.cmp_rates.retweets_cpm)).toBeGreaterThan(0);
    expect(parseInt(campaign.cmp_rates.comments_cpm)).toBeGreaterThan(0);
    expect(parseInt(campaign.cmp_rates.link_clicks_cpm)).toBeGreaterThan(0);
  }

  static campaignIsActive(campaign: Campaign): void {
    // Assuming status constants: 0=draft, 1=active, 2=completed, 3=cancelled
    expect(parseInt(campaign.status)).toBe(1);
  }

  static campaignIsCompleted(campaign: Campaign): void {
    expect(parseInt(campaign.status)).toBe(2);
  }

  // Content assertions
  static isValidContent(content: Content, expectedData?: Partial<Content>): void {
    this.hasValidObjectId(content);
    expect(content.content_id).toBeDefined();
    expect(content.campaign_id).toBeDefined();
    expect(content.creator_id).toBeDefined();
    expect(content.content_link).toBeDefined();
    expect(content.status).toBeDefined();
    expect(content.submission_timestamp).toBeDefined();
    expect(content.engagement_metrics).toBeDefined();

    if (expectedData) {
      if (expectedData.content_id) {
        expect(content.content_id).toBe(expectedData.content_id);
      }
      if (expectedData.campaign_id) {
        expect(content.campaign_id).toBe(expectedData.campaign_id);
      }
      if (expectedData.creator_id) {
        expect(content.creator_id).toBe(expectedData.creator_id);
      }
    }
  }

  static contentIsApproved(content: Content): void {
    // Assuming status: 0=draft, 1=pending, 2=rejected, 3=approved, 4=published
    expect(parseInt(content.status)).toBe(3);
    expect(content.review_timestamp).toBeDefined();
    expect(content.review_timestamp).not.toBeNull();
  }

  static contentIsPublished(content: Content): void {
    expect(parseInt(content.status)).toBe(4);
    expect(content.publish_timestamp).toBeDefined();
    expect(content.publish_timestamp).not.toBeNull();
  }

  static contentHasEngagementMetrics(content: Content): void {
    expect(content.engagement_metrics).toBeDefined();
    expect(content.engagement_metrics.likes_count).toBeDefined();
    expect(content.engagement_metrics.views_count).toBeDefined();
    expect(content.engagement_metrics.retweets_count).toBeDefined();
    expect(content.engagement_metrics.comments_count).toBeDefined();
    expect(content.engagement_metrics.link_clicks_count).toBeDefined();
    expect(content.engagement_metrics.last_updated).toBeDefined();
  }

  // Payment assertions
  static isValidPaymentReceipt(receipt: PaymentReceipt, expectedData?: Partial<PaymentReceipt>): void {
    this.hasValidObjectId(receipt);
    expect(receipt.payment_type).toBeDefined();
    expect(receipt.amount).toBeDefined();
    expect(receipt.campaign_id).toBeDefined();
    expect(receipt.recipient_id).toBeDefined();
    expect(receipt.recipient_address).toBeDefined();
    expect(receipt.payment_timestamp).toBeDefined();

    expect(parseInt(receipt.amount)).toBeGreaterThan(0);

    if (expectedData) {
      if (expectedData.campaign_id) {
        expect(receipt.campaign_id).toBe(expectedData.campaign_id);
      }
      if (expectedData.recipient_id) {
        expect(receipt.recipient_id).toBe(expectedData.recipient_id);
      }
      if (expectedData.amount) {
        expect(receipt.amount).toBe(expectedData.amount);
      }
    }
  }

  static isBasePayment(receipt: PaymentReceipt): void {
    // Assuming payment types: 0=base, 1=bonus
    expect(parseInt(receipt.payment_type)).toBe(0);
  }

  static isBonusPayment(receipt: PaymentReceipt): void {
    expect(parseInt(receipt.payment_type)).toBe(1);
  }

  // Transaction result assertions
  static transactionSucceeded(result: any): void {
    expect(result).toBeDefined();
    expect(result.effects).toBeDefined();
    expect(result.effects.status).toBeDefined();
    expect(result.effects.status.status).toBe('success');
  }

  static transactionFailed(result: any): void {
    expect(result).toBeDefined();
    expect(result.effects).toBeDefined();
    expect(result.effects.status).toBeDefined();
    expect(result.effects.status.status).toBe('failure');
  }

  static hasObjectChanges(result: any): void {
    expect(result.objectChanges).toBeDefined();
    expect(Array.isArray(result.objectChanges)).toBe(true);
    expect(result.objectChanges.length).toBeGreaterThan(0);
  }

  static hasEvents(result: any): void {
    expect(result.events).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
  }

  static hasCreatedObjects(result: any, count?: number): void {
    this.hasObjectChanges(result);
    const created = result.objectChanges.filter((change: any) => change.type === 'created');
    expect(created.length).toBeGreaterThan(0);

    if (count) {
      expect(created.length).toBe(count);
    }
  }

  // Event assertions
  static hasEventOfType(result: any, eventType: string): void {
    this.hasEvents(result);
    const matchingEvents = result.events.filter((event: any) =>
      event.type.includes(eventType)
    );
    expect(matchingEvents.length).toBeGreaterThan(0);
  }

  static eventHasFields(event: any, fields: string[]): void {
    expect(event.parsedJson).toBeDefined();
    fields.forEach(field => {
      expect(event.parsedJson[field]).toBeDefined();
    });
  }

  // Balance assertions
  static balanceEquals(actual: string, expected: number): void {
    expect(parseInt(actual)).toBe(expected);
  }

  static balanceGreaterThan(actual: string, minimum: number): void {
    expect(parseInt(actual)).toBeGreaterThan(minimum);
  }

  static balanceLessThan(actual: string, maximum: number): void {
    expect(parseInt(actual)).toBeLessThan(maximum);
  }
}