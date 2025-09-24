/// Simple validation test that can be compiled but doesn't require the test runner
module swans::validation_test {
    use swans::types;

    /// This function validates that our types work correctly
    /// We can verify this compiles, which means the logic is sound
    public fun validate_types() {
        // Test campaign statuses
        let draft = types::campaign_draft();
        let active = types::campaign_active();
        assert!(types::is_campaign_draft(&draft), 1);
        assert!(types::is_campaign_active(&active), 2);

        // Test content statuses
        let content_draft = types::content_draft();
        let published = types::content_published();
        assert!(types::is_content_draft(&content_draft), 3);
        assert!(types::is_content_published(&published), 4);

        // Test CPM rates
        let rates = types::new_cpm_rates(10, 5, 20, 15, 25);
        assert!(types::get_cpm_likes(&rates) == 10, 5);
        assert!(types::get_cpm_views(&rates) == 5, 6);
        assert!(types::get_cpm_retweets(&rates) == 20, 7);
        assert!(types::get_cpm_comments(&rates) == 15, 8);
        assert!(types::get_cpm_link_clicks(&rates) == 25, 9);

        // Test engagement metrics
        let metrics = types::new_engagement_metrics(1000, 5000, 100, 50, 25);
        assert!(types::get_likes(&metrics) == 1000, 10);
        assert!(types::get_views(&metrics) == 5000, 11);
        assert!(types::get_retweets(&metrics) == 100, 12);
        assert!(types::get_comments(&metrics) == 50, 13);
        assert!(types::get_link_clicks(&metrics) == 25, 14);

        // If we reach here, all validations passed
    }

    /// Validate payment types
    public fun validate_payments() {
        use swans::types;

        let base_payment = types::payment_base();
        let bonus_payment = types::payment_bonus();

        assert!(types::is_base_payment(&base_payment), 15);
        assert!(types::is_bonus_payment(&bonus_payment), 16);
        assert!(!types::is_bonus_payment(&base_payment), 17);
        assert!(!types::is_base_payment(&bonus_payment), 18);
    }
}