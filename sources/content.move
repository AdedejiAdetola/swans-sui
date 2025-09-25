module swans::content {
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};
    
    use swans::campaign::{Self, Campaign};
    use swans::creator::{Self, Creator};
    use swans::types::{Self, ContentStatus, EngagementMetrics};
    use swans::payment;

    // ===== Content Struct =====
    public struct Content has key, store {
        id: UID,
        content_id: String,
        campaign_id: String,
        owner_id: String,
        owner_address: address,
        content_link: String,
        status: ContentStatus,
        
        // Engagement metrics (filled after publishing)
        engagement_metrics: EngagementMetrics,
        
        submission_timestamp: u64,
        review_timestamp: Option<u64>,
        published_timestamp: Option<u64>,
        reviewer_notes: String,
    }

    // ===== Events =====
    public struct ContentSubmitted has copy, drop {
        content_id: String,
        campaign_id: String,
        creator_id: String,
    }

    public struct ContentReviewed has copy, drop {
        content_id: String,
        campaign_id: String,
        approved: bool,
        reviewer_notes: String,
    }

    public struct ContentPublished has copy, drop {
        content_id: String,
        campaign_id: String,
        creator_id: String,
    }

    public struct EngagementMetricsUpdated has copy, drop {
        content_id: String,
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64,
    }

    // ===== Content Management =====

    /// Submit content for campaign
    public fun submit_content(
        campaign: &mut Campaign,
        creator: &Creator,
        content_id: String,
        content_link: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(creator::is_creator_owner(creator, tx_context::sender(ctx)), types::err_not_authorized());
        assert!(campaign::has_applied(campaign, creator::get_creator_id(creator)), types::err_not_authorized());
        assert!(campaign::get_campaign_status(campaign) == types::campaign_active(), types::err_campaign_not_active());

        let content = Content {
            id: object::new(ctx),
            content_id,
            campaign_id: campaign::get_campaign_id(campaign),
            owner_id: creator::get_creator_id(creator),
            owner_address: creator::get_creator_owner(creator),
            content_link,
            status: types::new_content_status(types::content_pending()),
            engagement_metrics: types::empty_engagement_metrics(),
            submission_timestamp: clock::timestamp_ms(clock),
            review_timestamp: option::none(),
            published_timestamp: option::none(),
            reviewer_notes: string::utf8(b""),
        };

        let content_object_id = object::id(&content);
        
        // Add to campaign's content submissions
        campaign::add_content_to_campaign(campaign, creator::get_creator_id(creator), content_object_id);

        event::emit(ContentSubmitted {
            content_id: content.content_id,
            campaign_id: content.campaign_id,
            creator_id: content.owner_id,
        });

        transfer::transfer(content, creator::get_creator_owner(creator));
    }

    /// Review and approve/reject content
    public fun review_content(
        campaign: &Campaign,
        content: &mut Content,
        approve: bool,
        reviewer_notes: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(campaign::get_brand_owner(campaign) == tx_context::sender(ctx), types::err_not_authorized());
        assert!(content.campaign_id == campaign::get_campaign_id(campaign), types::err_invalid_status());
        assert!(types::content_status_value(&content.status) == types::content_pending(), types::err_invalid_status());

        content.status = if (approve) {
            types::new_content_status(types::content_accepted())
        } else {
            types::new_content_status(types::content_rejected())
        };
        
        content.reviewer_notes = reviewer_notes;
        content.review_timestamp = option::some(clock::timestamp_ms(clock));

        event::emit(ContentReviewed {
            content_id: content.content_id,
            campaign_id: content.campaign_id,
            approved: approve,
            reviewer_notes,
        });
    }

    /// Publish approved content (triggers base payment)
    public fun publish_content(
        campaign: &mut Campaign,
        content: &mut Content,
        creator: &mut Creator,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(content.owner_address == tx_context::sender(ctx), types::err_not_authorized());
        assert!(types::content_status_value(&content.status) == types::content_accepted(), types::err_invalid_status());
        assert!(creator::get_creator_id(creator) == content.owner_id, types::err_not_authorized());

        content.status = types::new_content_status(types::content_published());
        content.published_timestamp = option::some(clock::timestamp_ms(clock));

        // Process base payment
        let base_payment = campaign::get_base_pay_per_creator(campaign);
        let payment_coin = campaign::make_campaign_payment(campaign, base_payment, ctx);
        
        transfer::public_transfer(payment_coin, content.owner_address);

        // Update creator earnings
        creator::add_creator_earnings(creator, base_payment);

        // Create payment receipt
        payment::create_base_payment_receipt(
            content.campaign_id,
            content.owner_id,
            content.owner_address,
            base_payment,
            clock::timestamp_ms(clock),
            ctx
        );

        event::emit(ContentPublished {
            content_id: content.content_id,
            campaign_id: content.campaign_id,
            creator_id: content.owner_id,
        });
    }

    /// Update engagement metrics for published content
    public fun update_engagement_metrics(
        campaign: &Campaign,
        content: &mut Content,
        likes: u64,
        views: u64,
        retweets: u64,
        comments: u64,
        link_clicks: u64,
        ctx: &mut TxContext
    ) {
        assert!(campaign::get_brand_owner(campaign) == tx_context::sender(ctx), types::err_not_authorized());
        assert!(types::content_status_value(&content.status) == types::content_published(), types::err_invalid_status());

        content.engagement_metrics = types::new_engagement_metrics(
            likes,
            views,
            retweets,
            comments,
            link_clicks
        );

        event::emit(EngagementMetricsUpdated {
            content_id: content.content_id,
            likes,
            views,
            retweets,
            comments,
            link_clicks,
        });
    }

    /// Process bonus payment for winning content
    public fun process_bonus_payment(
        campaign: &mut Campaign,
        content: &Content,
        creator: &mut Creator,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(campaign::get_brand_owner(campaign) == tx_context::sender(ctx), types::err_not_authorized());
        assert!(content.campaign_id == campaign::get_campaign_id(campaign), types::err_invalid_status());
        assert!(campaign::is_winner(campaign, content.owner_id), types::err_not_authorized());
        assert!(types::content_status_value(&content.status) == types::content_published(), types::err_invalid_status());

        // Calculate bonus based on engagement
        let bonus_amount = campaign::calculate_engagement_bonus(
            campaign,
            types::get_likes(&content.engagement_metrics),
            types::get_views(&content.engagement_metrics),
            types::get_retweets(&content.engagement_metrics),
            types::get_comments(&content.engagement_metrics),
            types::get_link_clicks(&content.engagement_metrics)
        );
        
        if (bonus_amount > 0) {
            let payment_coin = campaign::make_campaign_payment(campaign, bonus_amount, ctx);
            transfer::public_transfer(payment_coin, content.owner_address);

            // Update creator earnings
            creator::add_creator_earnings(creator, bonus_amount);

            // Create payment receipt
            payment::create_bonus_payment_receipt(
                content.campaign_id,
                content.owner_id,
                content.owner_address,
                bonus_amount,
                clock::timestamp_ms(clock),
                ctx
            );
        };
    }

    // ===== View Functions =====

    public fun get_content_id(content: &Content): String {
        content.content_id
    }

    public fun get_campaign_id(content: &Content): String {
        content.campaign_id
    }

    public fun get_owner_id(content: &Content): String {
        content.owner_id
    }

    public fun get_owner_address(content: &Content): address {
        content.owner_address
    }

    public fun get_content_link(content: &Content): String {
        content.content_link
    }

    public fun get_content_status(content: &Content): u8 {
        types::content_status_value(&content.status)
    }

    public fun get_engagement_metrics(content: &Content): EngagementMetrics {
        content.engagement_metrics
    }

    public fun get_submission_timestamp(content: &Content): u64 {
        content.submission_timestamp
    }

    public fun get_published_timestamp(content: &Content): Option<u64> {
        content.published_timestamp
    }

    public fun get_reviewer_notes(content: &Content): String {
        content.reviewer_notes
    }

    public fun is_published(content: &Content): bool {
        types::content_status_value(&content.status) == types::content_published()
    }

    public fun is_pending_review(content: &Content): bool {
        types::content_status_value(&content.status) == types::content_pending()
    }

    public fun is_content_owner(content: &Content, addr: address): bool {
        content.owner_address == addr
    }
}