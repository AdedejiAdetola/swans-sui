#[test_only]
module swans::simple_validation_test {
    #[test]
    fun test_validation_functions() {
        use swans::types;

        // Test our validation functions
        assert!(types::validate_campaign_statuses(), 1);
        assert!(types::validate_content_statuses(), 2);
        assert!(types::validate_payment_types(), 3);
        assert!(types::validate_cpm_rates(), 4);
        assert!(types::validate_engagement_metrics(), 5);
        assert!(types::validate_all(), 6);
    }
}