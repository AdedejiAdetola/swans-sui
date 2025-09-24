/// Swans Campaign Management System - Main Library
/// 
/// This is the main entry point for the Swans campaign management smart contracts.
/// It re-exports all public functions and types from the various modules.
module swans::lib {
    // Re-export all public types and functions from sub-modules
    
    // Core types and utilities
    use swans::types::{
        CampaignStatus, ContentStatus, DisputeStatus, PaymentType,
        EngagementMetrics, CpmRates,
        new_campaign_status, new_content_status, new_dispute_status, new_payment_type,
        campaign_draft, campaign_active, campaign_paused, campaign_completed, campaign_cancelled,
        content_draft, content_pending, content_rejected, content_accepted, content_published,
        dispute_open, dispute_resolved, dispute_cancelled,
        payment_base, payment_bonus
    };
    
    // Platform registry
    use swans::registry::{
        PlatformRegistry,
        register_brand_in_registry, register_creator_in_registry, register_campaign_in_registry,
        is_brand_registered, is_creator_registered, is_campaign_registered,
        get_admin
    };
    
    // Brand management  
    use swans::brand::{
        Brand,
        register_brand, fund_brand_account, withdraw_brand_funds, update_brand_profile,
        get_brand_id, get_brand_name, get_brand_owner, get_brand_balance, get_brand_reputation,
        is_brand_owner
    };
    
    // Creator management
    use swans::creator::{
        Creator,
        register_creator, update_creator_profile, update_social_media_handles,
        get_creator_id, get_creator_name, get_creator_owner, get_creator_reputation,
        get_creator_rank, get_completed_campaigns, get_total_earnings, is_creator_verified,
        is_creator_owner
    };
    
    // Campaign management
    use swans::campaign::{
        Campaign, CampaignApplication,
        create_campaign, apply_to_campaign, update_campaign_status, select_campaign_winners,
        calculate_engagement_bonus, is_winner, has_applied,
        get_campaign_id, get_campaign_status, get_campaign_budget, get_campaign_remaining_balance,
        is_campaign_active, is_application_period_active
    };
    
    // Content management
    use swans::content::{
        Content,
        submit_content, review_content, publish_content, update_engagement_metrics,
        process_bonus_payment,
        get_content_id, get_content_status, get_engagement_metrics, is_published,
        is_content_owner
    };
    
    // Payment system
    use swans::payment::{
        PaymentReceipt,
        create_base_payment_receipt, create_bonus_payment_receipt, create_custom_payment_receipt,
        get_payment_type, get_amount, is_base_payment, is_bonus_payment,
        calculate_total_earnings, count_payment_types
    };
    
    // Dispute management
    use swans::dispute::{
        Dispute,
        open_dispute, add_dispute_evidence, resolve_dispute, close_dispute_by_agreement,
        is_dispute_open, is_dispute_resolved, can_participate_in_dispute,
        get_dispute_id, get_dispute_status, get_dispute_type
    };
}

/// Version information for the Swans platform
module swans::version {
    use std::string::{Self, String};
    
    const MAJOR_VERSION: u64 = 1;
    const MINOR_VERSION: u64 = 0;
    const PATCH_VERSION: u64 = 0;
    
    public fun get_version(): (u64, u64, u64) {
        (MAJOR_VERSION, MINOR_VERSION, PATCH_VERSION)
    }
    
    public fun get_version_string(): String {
        string::utf8(b"1.0.0")
    }
}