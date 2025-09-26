// Sui Object Types for SWANS Platform

export interface PlatformRegistry {
  id: { id: string };
  admin: string;
  brands: { type: string; fields: { id: { id: string } } };
  creators: { type: string; fields: { id: { id: string } } };
  campaigns: { type: string; fields: { id: { id: string } } };
}

export interface Brand {
  id: { id: string };
  brand_id: string;
  brand_name: string;
  token_wallet: string;
  logo_url: string;
  description: string;
  reputation: string;
  balance: string;
  total_campaigns: string;
  total_spent: string;
  creation_timestamp: string;
}

export interface Creator {
  id: { id: string };
  creator_id: string;
  name: string;
  token_wallet: string;
  category: string;
  avatar_url: string;
  reputation: string;
  total_earnings: string;
  total_campaigns: string;
  social_handles: {
    twitter: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  creation_timestamp: string;
}

export interface Campaign {
  id: { id: string };
  campaign_id: string;
  brand_id: string;
  brand_owner: string;
  campaign_type: string;
  application_start: string;
  application_end: string;
  campaign_start: string;
  campaign_end: string;
  base_pay_per_creator: string;
  total_budget: string;
  escrow_balance: string;
  cpm_rates: {
    likes_cpm: string;
    views_cpm: string;
    retweets_cpm: string;
    comments_cpm: string;
    link_clicks_cpm: string;
  };
  status: string;
  applications: { type: string; fields: { id: { id: string } } };
  content_submissions: { type: string; fields: { id: { id: string } } };
  winners: string[];
  max_winners: string;
  creation_timestamp: string;
}

export interface CampaignApplication {
  id: { id: string };
  campaign_id: string;
  creator_id: string;
  creator_address: string;
  application_timestamp: string;
}

export interface Content {
  id: { id: string };
  content_id: string;
  campaign_id: string;
  creator_id: string;
  content_link: string;
  status: string;
  submission_timestamp: string;
  review_timestamp: string | null;
  publish_timestamp: string | null;
  engagement_metrics: {
    likes_count: string;
    views_count: string;
    retweets_count: string;
    comments_count: string;
    link_clicks_count: string;
    last_updated: string;
  };
}

export interface PaymentReceipt {
  id: { id: string };
  payment_type: string;
  amount: string;
  campaign_id: string;
  recipient_id: string;
  recipient_address: string;
  payment_timestamp: string;
}

// Event Types
export interface BrandRegisteredEvent {
  brand_id: string;
  brand_name: string;
  brand_address: string;
  timestamp: string;
}

export interface CreatorRegisteredEvent {
  creator_id: string;
  creator_name: string;
  creator_address: string;
  category: string;
  timestamp: string;
}

export interface CampaignCreatedEvent {
  campaign_id: string;
  brand_id: string;
  total_budget: string;
  base_pay: string;
  timestamp: string;
}

export interface CampaignApplicationEvent {
  campaign_id: string;
  creator_id: string;
  creator_address: string;
  timestamp: string;
}

export interface ContentSubmittedEvent {
  campaign_id: string;
  content_id: string;
  creator_id: string;
  content_link: string;
  timestamp: string;
}

export interface ContentReviewedEvent {
  campaign_id: string;
  content_id: string;
  approved: boolean;
  reviewer: string;
  timestamp: string;
}

export interface BasePaymentEvent {
  campaign_id: string;
  creator_id: string;
  amount: string;
  timestamp: string;
}

export interface BonusPaymentEvent {
  campaign_id: string;
  creator_id: string;
  amount: string;
  content_id: string;
  timestamp: string;
}

// Type guards and utilities
export const isValidObjectId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0 && id.startsWith('0x');
};

export const parseBalance = (balance: string): number => {
  return parseInt(balance, 10);
};

export const parseTimestamp = (timestamp: string): Date => {
  return new Date(parseInt(timestamp, 10));
};