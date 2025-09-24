// Isolated tests that avoid complex dependencies and shared objects
#[test_only]
module swans::isolated_tests {

    // Test only the types module - no external dependencies
    #[test]
    fun test_types_only() {
        use swans::types;

        // Test campaign statuses
        let draft = types::campaign_draft();
        let active = types::campaign_active();
        let paused = types::campaign_paused();
        let completed = types::campaign_completed();
        let cancelled = types::campaign_cancelled();

        // Verify status checkers work
        assert!(types::is_campaign_draft(&draft));
        assert!(types::is_campaign_active(&active));
        assert!(types::is_campaign_paused(&paused));
        assert!(types::is_campaign_completed(&completed));
        assert!(types::is_campaign_cancelled(&cancelled));

        // Test cross-status checks
        assert!(!types::is_campaign_active(&draft));
        assert!(!types::is_campaign_draft(&active));
    }

    #[test]
    fun test_content_statuses() {
        use swans::types;

        let draft = types::content_draft();
        let pending = types::content_pending();
        let rejected = types::content_rejected();
        let accepted = types::content_accepted();
        let published = types::content_published();

        assert!(types::is_content_draft(&draft));
        assert!(types::is_content_pending(&pending));
        assert!(types::is_content_rejected(&rejected));
        assert!(types::is_content_accepted(&accepted));
        assert!(types::is_content_published(&published));

        // Cross-checks
        assert!(!types::is_content_published(&draft));
        assert!(!types::is_content_draft(&published));
    }

    #[test]
    fun test_payment_types() {
        use swans::types;

        let base = types::payment_base();
        let bonus = types::payment_bonus();

        assert!(types::is_base_payment(&base));
        assert!(types::is_bonus_payment(&bonus));
        assert!(!types::is_bonus_payment(&base));
        assert!(!types::is_base_payment(&bonus));
    }

    #[test]
    fun test_cpm_rates() {
        use swans::types;

        let rates = types::new_cpm_rates(10, 20, 30, 40, 50);

        assert!(types::get_cpm_likes(&rates) == 10);
        assert!(types::get_cpm_views(&rates) == 20);
        assert!(types::get_cpm_retweets(&rates) == 30);
        assert!(types::get_cpm_comments(&rates) == 40);
        assert!(types::get_cpm_link_clicks(&rates) == 50);
    }

    #[test]
    fun test_engagement_metrics() {
        use swans::types;

        let metrics = types::new_engagement_metrics(100, 500, 25, 15, 8);

        assert!(types::get_likes(&metrics) == 100);
        assert!(types::get_views(&metrics) == 500);
        assert!(types::get_retweets(&metrics) == 25);
        assert!(types::get_comments(&metrics) == 15);
        assert!(types::get_link_clicks(&metrics) == 8);
    }
}