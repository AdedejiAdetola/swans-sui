/// Event system for Harmonia platform
module swans::events {
    use std::string::String;
    use sui::event;

    // === Campaign Events ===

    public struct CampaignCreated has copy, drop {
        campaign_id: ID,
        campaign_string_id: String,
        brand_address: address,
        escrow_id: ID,
        funding_amount: u64,
    }

    public struct CampaignStatusChanged has copy, drop {
        campaign_id: ID,
        old_status: u8,
        new_status: u8,
        changed_by: address,
    }

    // === Application Events ===

    public struct ApplicationSubmitted has copy, drop {
        campaign_id: ID,
        applicant_id: String,
        applicant_address: address,
        application_timestamp: u64,
    }

    public struct ApplicationReviewed has copy, drop {
        campaign_id: ID,
        applicant_id: String,
        accepted: bool,
        reviewer: address,
    }

    // === Content Events ===

    public struct ContentSubmitted has copy, drop {
        campaign_id: ID,
        content_id: String,
        creator_id: String,
        content_link: String,
    }

    public struct ContentReviewed has copy, drop {
        campaign_id: ID,
        content_id: String,
        approved: bool,
        reviewer: address,
    }

    public struct ContentPublished has copy, drop {
        campaign_id: ID,
        content_id: String,
        creator_id: String,
        publish_timestamp: u64,
    }

    public struct EngagementMetricsUpdated has copy, drop {
        content_id: String,
        campaign_id: ID,
        likes_count: u64,
        views_count: u64,
        retweets_count: u64,
        comments_count: u64,
        link_clicks_count: u64,
        updated_timestamp: u64,
    }

    // === Payment Events ===

    public struct BasePaymentProcessed has copy, drop {
        campaign_id: ID,
        creator_id: String,
        amount: u64,
        recipient: address,
    }

    public struct EngagementBonusProcessed has copy, drop {
        campaign_id: ID,
        content_id: String,
        creator_id: String,
        bonus_amount: u64,
    }

    public struct WinnerSelected has copy, drop {
        campaign_id: ID,
        winner_content_id: String,
        winner_creator_id: String,
        bonus_amount: u64,
    }

    public struct PaymentReceiptCreated has copy, drop {
        receipt_id: ID,
        campaign_id: ID,
        creator_id: String,
        amount: u64,
        payment_type: u8,
        payment_timestamp: u64,
    }

    // === Dispute Events ===

    public struct DisputeFiled has copy, drop {
        dispute_id: ID,
        campaign_id: ID,
        initiator: address,
        dispute_type: u8,
    }

    public struct DisputeResolved has copy, drop {
        dispute_id: ID,
        resolution: String,
        resolver: address,
        resolution_timestamp: u64,
    }

    public struct EvidenceSubmitted has copy, drop {
        dispute_id: ID,
        submitter: address,
        evidence_url: String,
        submission_timestamp: u64,
    }

    // === Profile Events ===

    public struct BrandProfileCreated has copy, drop {
        brand_id: ID,
        brand_address: address,
        brand_name: String,
        creation_timestamp: u64,
    }

    public struct CreatorProfileCreated has copy, drop {
        creator_id: ID,
        creator_address: address,
        creator_name: String,
        creation_timestamp: u64,
    }

    public struct ReputationUpdated has copy, drop {
        profile_id: ID,
        profile_type: u8, // 0=Brand, 1=Creator
        old_reputation: u64,
        new_reputation: u64,
        updated_by: address,
    }

    // === Public Emit Functions ===

    // Campaign event emitters
    public fun emit_campaign_created(
        campaign_id: ID,
        campaign_string_id: String,
        brand_address: address,
        escrow_id: ID,
        funding_amount: u64,
    ) {
        event::emit(CampaignCreated {
            campaign_id,
            campaign_string_id,
            brand_address,
            escrow_id,
            funding_amount,
        });
    }

    public fun emit_campaign_status_changed(
        campaign_id: ID,
        old_status: u8,
        new_status: u8,
        changed_by: address,
    ) {
        event::emit(CampaignStatusChanged {
            campaign_id,
            old_status,
            new_status,
            changed_by,
        });
    }

    // Application event emitters
    public fun emit_application_submitted(
        campaign_id: ID,
        applicant_id: String,
        applicant_address: address,
        application_timestamp: u64,
    ) {
        event::emit(ApplicationSubmitted {
            campaign_id,
            applicant_id,
            applicant_address,
            application_timestamp,
        });
    }

    public fun emit_application_reviewed(
        campaign_id: ID,
        applicant_id: String,
        accepted: bool,
        reviewer: address,
    ) {
        event::emit(ApplicationReviewed {
            campaign_id,
            applicant_id,
            accepted,
            reviewer,
        });
    }

    // Content event emitters
    public fun emit_content_submitted(
        campaign_id: ID,
        content_id: String,
        creator_id: String,
        content_link: String,
    ) {
        event::emit(ContentSubmitted {
            campaign_id,
            content_id,
            creator_id,
            content_link,
        });
    }

    public fun emit_content_reviewed(
        campaign_id: ID,
        content_id: String,
        approved: bool,
        reviewer: address,
    ) {
        event::emit(ContentReviewed {
            campaign_id,
            content_id,
            approved,
            reviewer,
        });
    }

    public fun emit_content_published(
        campaign_id: ID,
        content_id: String,
        creator_id: String,
        publish_timestamp: u64,
    ) {
        event::emit(ContentPublished {
            campaign_id,
            content_id,
            creator_id,
            publish_timestamp,
        });
    }

    public fun emit_engagement_metrics_updated(
        content_id: String,
        campaign_id: ID,
        likes_count: u64,
        views_count: u64,
        retweets_count: u64,
        comments_count: u64,
        link_clicks_count: u64,
        updated_timestamp: u64,
    ) {
        event::emit(EngagementMetricsUpdated {
            content_id,
            campaign_id,
            likes_count,
            views_count,
            retweets_count,
            comments_count,
            link_clicks_count,
            updated_timestamp,
        });
    }

    // Payment event emitters
    public fun emit_base_payment_processed(
        campaign_id: ID,
        creator_id: String,
        amount: u64,
        recipient: address,
    ) {
        event::emit(BasePaymentProcessed {
            campaign_id,
            creator_id,
            amount,
            recipient,
        });
    }

    public fun emit_engagement_bonus_processed(
        campaign_id: ID,
        content_id: String,
        creator_id: String,
        bonus_amount: u64,
    ) {
        event::emit(EngagementBonusProcessed {
            campaign_id,
            content_id,
            creator_id,
            bonus_amount,
        });
    }

    public fun emit_winner_selected(
        campaign_id: ID,
        winner_content_id: String,
        winner_creator_id: String,
        bonus_amount: u64,
    ) {
        event::emit(WinnerSelected {
            campaign_id,
            winner_content_id,
            winner_creator_id,
            bonus_amount,
        });
    }

    public fun emit_payment_receipt_created(
        receipt_id: ID,
        campaign_id: ID,
        creator_id: String,
        amount: u64,
        payment_type: u8,
        payment_timestamp: u64,
    ) {
        event::emit(PaymentReceiptCreated {
            receipt_id,
            campaign_id,
            creator_id,
            amount,
            payment_type,
            payment_timestamp,
        });
    }

    // Dispute event emitters
    public fun emit_dispute_filed(
        dispute_id: ID,
        campaign_id: ID,
        initiator: address,
        dispute_type: u8,
    ) {
        event::emit(DisputeFiled {
            dispute_id,
            campaign_id,
            initiator,
            dispute_type,
        });
    }

    public fun emit_dispute_resolved(
        dispute_id: ID,
        resolution: String,
        resolver: address,
        resolution_timestamp: u64,
    ) {
        event::emit(DisputeResolved {
            dispute_id,
            resolution,
            resolver,
            resolution_timestamp,
        });
    }

    public fun emit_evidence_submitted(
        dispute_id: ID,
        submitter: address,
        evidence_url: String,
        submission_timestamp: u64,
    ) {
        event::emit(EvidenceSubmitted {
            dispute_id,
            submitter,
            evidence_url,
            submission_timestamp,
        });
    }

    // Profile event emitters
    public fun emit_brand_profile_created(
        brand_id: ID,
        brand_address: address,
        brand_name: String,
        creation_timestamp: u64,
    ) {
        event::emit(BrandProfileCreated {
            brand_id,
            brand_address,
            brand_name,
            creation_timestamp,
        });
    }

    public fun emit_creator_profile_created(
        creator_id: ID,
        creator_address: address,
        creator_name: String,
        creation_timestamp: u64,
    ) {
        event::emit(CreatorProfileCreated {
            creator_id,
            creator_address,
            creator_name,
            creation_timestamp,
        });
    }

    public fun emit_reputation_updated(
        profile_id: ID,
        profile_type: u8,
        old_reputation: u64,
        new_reputation: u64,
        updated_by: address,
    ) {
        event::emit(ReputationUpdated {
            profile_id,
            profile_type,
            old_reputation,
            new_reputation,
            updated_by,
        });
    }
}