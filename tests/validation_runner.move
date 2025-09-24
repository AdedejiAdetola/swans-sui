// Validation runner that can be called during deployment
module swans::validation_runner {
    use swans::types;

    /// Entry function that can be called to validate the system
    public entry fun run_all_validations() {
        // Run all validation functions from types module
        assert!(types::validate_campaign_statuses(), 1);
        assert!(types::validate_content_statuses(), 2);
        assert!(types::validate_payment_types(), 3);
        assert!(types::validate_cpm_rates(), 4);
        assert!(types::validate_engagement_metrics(), 5);
        assert!(types::validate_all(), 6);
    }

    /// Individual validation runners for targeted testing
    public entry fun validate_campaign_statuses() {
        assert!(types::validate_campaign_statuses(), 1);
    }

    public entry fun validate_content_statuses() {
        assert!(types::validate_content_statuses(), 2);
    }

    public entry fun validate_payment_types() {
        assert!(types::validate_payment_types(), 3);
    }

    public entry fun validate_cpm_rates() {
        assert!(types::validate_cpm_rates(), 4);
    }

    public entry fun validate_engagement_metrics() {
        assert!(types::validate_engagement_metrics(), 5);
    }

    /// Simple view function to check if all validations pass without side effects
    public fun check_all_validations(): bool {
        types::validate_all()
    }
}