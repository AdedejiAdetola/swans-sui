module swans::types {
    use std::string::String;
    use std::option::Option;

    // ===== Error Codes =====
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_CAMPAIGN_NOT_ACTIVE: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    const E_INVALID_STATUS: u64 = 4;
    const E_CAMPAIGN_ENDED: u64 = 5;
    const E_ALREADY_APPLIED: u64 = 6;
    const E_CONTENT_NOT_FOUND: u64 = 7;
    const E_INVALID_WINNER_SELECTION: u64 = 8;

    // ===== Enums =====
    public struct CampaignStatus has copy, drop, store {
        value: u8
    }

    public struct ContentStatus has copy, drop, store {
        value: u8
    }

    public struct DisputeStatus has copy, drop, store {
        value: u8
    }

    public struct PaymentType has copy, drop, store {
        value: u8
    }

    // ===== Campaign Status Constants =====
    public fun campaign_draft(): u8 { 0 }
    public fun campaign_active(): u8 { 1 }
    public fun campaign_paused(): u8 { 2 }
    public fun campaign_completed(): u8 { 3 }
    public fun campaign_cancelled(): u8 { 4 }

    // ===== Content Status Constants =====
    public fun content_draft(): u8 { 0 }
    public fun content_pending(): u8 { 1 }
    public fun content_rejected(): u8 { 2 }
    public fun content_accepted(): u8 { 3 }
    public fun content_published(): u8 { 4 }

    // ===== Dispute Status Constants =====
    public fun dispute_open(): u8 { 0 }
    public fun dispute_resolved(): u8 { 1 }
    public fun dispute_cancelled(): u8 { 2 }

    // ===== Payment Type Constants =====
    public fun payment_base(): u8 { 0 }
    public fun payment_bonus(): u8 { 1 }

    // ===== Error Constants =====
    public fun err_not_authorized(): u64 { E_NOT_AUTHORIZED }
    public fun err_campaign_not_active(): u64 { E_CAMPAIGN_NOT_ACTIVE }
    public fun err_insufficient_funds(): u64 { E_INSUFFICIENT_FUNDS }
    public fun err_invalid_status(): u64 { E_INVALID_STATUS }
    public fun err_campaign_ended(): u64 { E_CAMPAIGN_ENDED }
    public fun err_already_applied(): u64 { E_ALREADY_APPLIED }
    public fun err_content_not_found(): u64 { E_CONTENT_NOT_FOUND }
    public fun err_invalid_winner_selection(): u64 { E_INVALID_WINNER_SELECTION }

    // ===== Constructor Functions =====
    public fun new_campaign_status(value: u8): CampaignStatus {
        CampaignStatus { value }
    }

    public fun new_content_status(value: u8): ContentStatus {
        ContentStatus { value }
    }

    public fun new_dispute_status(value: u8): DisputeStatus {
        DisputeStatus { value }
    }

    public fun new_payment_type(value: u8): PaymentType {
        PaymentType { value }
    }

    // ===== Getter Functions =====
    public fun campaign_status_value(status: &CampaignStatus): u8 {
        status.value
    }

    public fun content_status_value(status: &ContentStatus): u8 {
        status.value
    }

    public fun dispute_status_value(status: &DisputeStatus): u8 {
        status.value
    }

    public fun payment_type_value(payment_type: &PaymentType): u8 {
        payment_type.value
    }

    // ===== Engagement Metrics Struct =====
    public struct EngagementMetrics has copy, drop, store {
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64,
    }

    public fun new_engagement_metrics(
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64
    ): EngagementMetrics {
        EngagementMetrics {
            likes,
            views,
            retweets,
            comments,
            link_clicks,
        }
    }

    public fun empty_engagement_metrics(): EngagementMetrics {
        EngagementMetrics {
            likes: 0,
            views: 0,
            retweets: 0,
            comments: 0,
            link_clicks: 0,
        }
    }

    // ===== CPM Rates Struct =====
    public struct CpmRates has copy, drop, store {
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64,
    }

    public fun new_cpm_rates(
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64
    ): CpmRates {
        CpmRates {
            likes,
            views,
            retweets,
            comments,
            link_clicks,
        }
    }

    // ===== Getter functions for structs =====
    public fun get_likes(metrics: &EngagementMetrics): u64 { metrics.likes }
    public fun get_views(metrics: &EngagementMetrics): u64 { metrics.views }
    public fun get_retweets(metrics: &EngagementMetrics): u64 { metrics.retweets }
    public fun get_comments(metrics: &EngagementMetrics): u64 { metrics.comments }
    public fun get_link_clicks(metrics: &EngagementMetrics): u64 { metrics.link_clicks }

    public fun get_cpm_likes(rates: &CpmRates): u64 { rates.likes }
    public fun get_cpm_views(rates: &CpmRates): u64 { rates.views }
    public fun get_cpm_retweets(rates: &CpmRates): u64 { rates.retweets }
    public fun get_cpm_comments(rates: &CpmRates): u64 { rates.comments }
    public fun get_cpm_link_clicks(rates: &CpmRates): u64 { rates.link_clicks }

    // ===== Validation Functions (Alternative to Tests) =====

    /// Validate all campaign status functions work correctly
    public fun validate_campaign_statuses(): bool {
        let draft_status = new_campaign_status(campaign_draft());
        let active_status = new_campaign_status(campaign_active());
        let paused_status = new_campaign_status(campaign_paused());
        let completed_status = new_campaign_status(campaign_completed());
        let cancelled_status = new_campaign_status(campaign_cancelled());

        // Test each status value
        if (campaign_status_value(&draft_status) != campaign_draft()) return false;
        if (campaign_status_value(&active_status) != campaign_active()) return false;
        if (campaign_status_value(&paused_status) != campaign_paused()) return false;
        if (campaign_status_value(&completed_status) != campaign_completed()) return false;
        if (campaign_status_value(&cancelled_status) != campaign_cancelled()) return false;

        // Test status values are different
        if (campaign_status_value(&draft_status) == campaign_status_value(&active_status)) return false;
        if (campaign_status_value(&active_status) == campaign_status_value(&paused_status)) return false;

        true
    }

    /// Validate all content status functions work correctly
    public fun validate_content_statuses(): bool {
        let draft_status = new_content_status(content_draft());
        let pending_status = new_content_status(content_pending());
        let rejected_status = new_content_status(content_rejected());
        let accepted_status = new_content_status(content_accepted());
        let published_status = new_content_status(content_published());

        // Test each status value
        if (content_status_value(&draft_status) != content_draft()) return false;
        if (content_status_value(&pending_status) != content_pending()) return false;
        if (content_status_value(&rejected_status) != content_rejected()) return false;
        if (content_status_value(&accepted_status) != content_accepted()) return false;
        if (content_status_value(&published_status) != content_published()) return false;

        // Test status values are different
        if (content_status_value(&draft_status) == content_status_value(&published_status)) return false;
        if (content_status_value(&accepted_status) == content_status_value(&rejected_status)) return false;

        true
    }

    /// Validate payment types work correctly
    public fun validate_payment_types(): bool {
        let base_type = new_payment_type(payment_base());
        let bonus_type = new_payment_type(payment_bonus());

        if (payment_type_value(&base_type) != payment_base()) return false;
        if (payment_type_value(&bonus_type) != payment_bonus()) return false;
        if (payment_type_value(&base_type) == payment_type_value(&bonus_type)) return false;

        true
    }

    /// Validate CPM rates functionality
    public fun validate_cpm_rates(): bool {
        let rates = new_cpm_rates(10, 20, 30, 40, 50);

        if (get_cpm_likes(&rates) != 10) return false;
        if (get_cpm_views(&rates) != 20) return false;
        if (get_cpm_retweets(&rates) != 30) return false;
        if (get_cpm_comments(&rates) != 40) return false;
        if (get_cpm_link_clicks(&rates) != 50) return false;

        true
    }

    /// Validate engagement metrics functionality
    public fun validate_engagement_metrics(): bool {
        let metrics = new_engagement_metrics(100, 500, 25, 15, 8);

        if (get_likes(&metrics) != 100) return false;
        if (get_views(&metrics) != 500) return false;
        if (get_retweets(&metrics) != 25) return false;
        if (get_comments(&metrics) != 15) return false;
        if (get_link_clicks(&metrics) != 8) return false;

        true
    }

    /// Run all validation functions - returns true if all pass
    public fun validate_all(): bool {
        if (!validate_campaign_statuses()) return false;
        if (!validate_content_statuses()) return false;
        if (!validate_payment_types()) return false;
        if (!validate_cpm_rates()) return false;
        if (!validate_engagement_metrics()) return false;
        true
    }
}