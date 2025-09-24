/// Dispute resolution management module
module swans::disputes {
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use std::vector;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    
    use swans::events;
    use swans::profiles::{BrandCap, CreatorCap, AdminCap};

    // === Error Constants ===
    const EDISPUTE_ALREADY_EXISTS: u64 = 500;
    const EINVALID_DISPUTE_TYPE: u64 = 501;
    const EDISPUTE_NOT_FOUND: u64 = 502;
    const EUNAUTHORIZED: u64 = 503;
    const EINVALID_STATUS: u64 = 504;
    const EEVIDENCE_LIMIT_EXCEEDED: u64 = 505;
    const EINVALID_RESOLUTION: u64 = 506;

    // Dispute type constants
    const DISPUTE_TYPE_PAYMENT: u8 = 0;
    const DISPUTE_TYPE_CONTENT: u8 = 1;
    const DISPUTE_TYPE_CONTRACT: u8 = 2;

    // Dispute status constants
    const DISPUTE_STATUS_FILED: u8 = 0;
    const DISPUTE_STATUS_IN_REVIEW: u8 = 1;
    const DISPUTE_STATUS_RESOLVED: u8 = 2;
    const DISPUTE_STATUS_CLOSED: u8 = 3;

    // === Core Structs ===

    /// Platform capability for dispute resolution
    public struct DisputeResolutionCap has key, store {
        id: UID,
        resolver_address: address,
    }

    /// Dispute resolution record (shared object)
    public struct Dispute has key {
        id: UID,
        dispute_id: String,                // Unique dispute identifier
        campaign_id: ID,                   // Campaign reference
        content_id: Option<ID>,            // Related content if applicable
        initiator: address,                // Who filed the dispute
        respondent: address,               // Other party in dispute
        dispute_type: u8,                  // 0=Payment, 1=Content, 2=Contract
        status: u8,                        // 0=Filed, 1=InReview, 2=Resolved, 3=Closed
        description: String,               // Dispute description
        initiator_evidence: vector<String>, // Evidence URLs from initiator
        respondent_evidence: vector<String>, // Evidence URLs from respondent
        resolution: Option<String>,        // Final resolution
        resolution_timestamp: Option<u64>, // Resolution time
        filed_timestamp: u64,              // Filing time
        resolver_address: Option<address>, // Assigned resolver
    }

    // === Public Functions ===

    /// File a dispute as a brand
    public entry fun file_dispute_as_brand(
        brand_cap: &BrandCap,
        campaign_id: ID,
        content_id: Option<ID>,
        dispute_type: u8,
        dispute_id: String,
        description: String,
        evidence_urls: vector<String>,
        respondent: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate dispute type
        assert!(dispute_type <= DISPUTE_TYPE_CONTRACT, EINVALID_DISPUTE_TYPE);
        assert!(!string::is_empty(&description), EINVALID_RESOLUTION);
        
        let dispute = create_dispute(
            dispute_id,
            campaign_id,
            content_id,
            tx_context::sender(ctx),
            respondent,
            dispute_type,
            description,
            evidence_urls,
            clock::timestamp_ms(clock),
            ctx
        );
        
        // Emit dispute filed event
        events::emit_dispute_filed(
            object::uid_to_inner(&dispute.id),
            campaign_id,
            tx_context::sender(ctx),
            dispute_type,
        );
        
        // Share dispute object for multi-party access
        transfer::share_object(dispute);
    }

    /// File a dispute as a creator
    public entry fun file_dispute_as_creator(
        creator_cap: &CreatorCap,
        campaign_id: ID,
        content_id: Option<ID>,
        dispute_type: u8,
        dispute_id: String,
        description: String,
        evidence_urls: vector<String>,
        respondent: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate dispute type
        assert!(dispute_type <= DISPUTE_TYPE_CONTRACT, EINVALID_DISPUTE_TYPE);
        assert!(!string::is_empty(&description), EINVALID_RESOLUTION);
        
        let dispute = create_dispute(
            dispute_id,
            campaign_id,
            content_id,
            tx_context::sender(ctx),
            respondent,
            dispute_type,
            description,
            evidence_urls,
            clock::timestamp_ms(clock),
            ctx
        );
        
        // Emit dispute filed event
        events::emit_dispute_filed(
            object::uid_to_inner(&dispute.id),
            campaign_id,
            tx_context::sender(ctx),
            dispute_type,
        );
        
        // Share dispute object for multi-party access
        transfer::share_object(dispute);
    }

    /// Submit additional evidence to an existing dispute
    public entry fun submit_evidence(
        dispute: &mut Dispute,
        evidence_url: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify sender is a party to the dispute
        assert!(sender == dispute.initiator || sender == dispute.respondent, EUNAUTHORIZED);
        assert!(dispute.status == DISPUTE_STATUS_FILED || dispute.status == DISPUTE_STATUS_IN_REVIEW, EINVALID_STATUS);
        
        // Add evidence to appropriate list
        if (sender == dispute.initiator) {
            assert!(vector::length(&dispute.initiator_evidence) < 10, EEVIDENCE_LIMIT_EXCEEDED); // Max 10 pieces of evidence
            vector::push_back(&mut dispute.initiator_evidence, evidence_url);
        } else {
            assert!(vector::length(&dispute.respondent_evidence) < 10, EEVIDENCE_LIMIT_EXCEEDED);
            vector::push_back(&mut dispute.respondent_evidence, evidence_url);
        };
        
        // Emit evidence submission event
        events::emit_evidence_submitted(
            object::uid_to_inner(&dispute.id),
            sender,
            evidence_url,
            clock::timestamp_ms(clock),
        );
    }

    /// Assign a resolver to the dispute (admin only)
    public entry fun assign_resolver(
        _admin_cap: &AdminCap,
        dispute: &mut Dispute,
        resolver_address: address,
        ctx: &mut TxContext
    ) {
        assert!(dispute.status == DISPUTE_STATUS_FILED, EINVALID_STATUS);
        
        dispute.status = DISPUTE_STATUS_IN_REVIEW;
        dispute.resolver_address = option::some(resolver_address);
    }

    /// Resolve a dispute (resolver only)
    public entry fun resolve_dispute(
        resolution_cap: &DisputeResolutionCap,
        dispute: &mut Dispute,
        resolution_text: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify resolver authorization
        assert!(dispute.resolver_address == option::some(resolution_cap.resolver_address), EUNAUTHORIZED);
        assert!(tx_context::sender(ctx) == resolution_cap.resolver_address, EUNAUTHORIZED);
        assert!(dispute.status == DISPUTE_STATUS_IN_REVIEW, EINVALID_STATUS);
        assert!(!string::is_empty(&resolution_text), EINVALID_RESOLUTION);
        
        // Update dispute with resolution
        dispute.status = DISPUTE_STATUS_RESOLVED;
        dispute.resolution = option::some(resolution_text);
        dispute.resolution_timestamp = option::some(clock::timestamp_ms(clock));
        
        // Emit dispute resolved event
        events::emit_dispute_resolved(
            object::uid_to_inner(&dispute.id),
            resolution_text,
            tx_context::sender(ctx),
            clock::timestamp_ms(clock),
        );
    }

    /// Close a resolved dispute (admin only)
    public entry fun close_dispute(
        _admin_cap: &AdminCap,
        dispute: &mut Dispute,
        ctx: &mut TxContext
    ) {
        assert!(dispute.status == DISPUTE_STATUS_RESOLVED, EINVALID_STATUS);
        dispute.status = DISPUTE_STATUS_CLOSED;
    }

    /// Create dispute resolution capability (admin only)
    public entry fun create_dispute_resolution_cap(
        _admin_cap: &AdminCap,
        resolver_address: address,
        ctx: &mut TxContext
    ) {
        let resolution_cap = DisputeResolutionCap {
            id: object::new(ctx),
            resolver_address,
        };
        
        transfer::public_transfer(resolution_cap, resolver_address);
    }

    // === Helper Functions ===

    fun create_dispute(
        dispute_id: String,
        campaign_id: ID,
        content_id: Option<ID>,
        initiator: address,
        respondent: address,
        dispute_type: u8,
        description: String,
        evidence_urls: vector<String>,
        filed_timestamp: u64,
        ctx: &mut TxContext
    ): Dispute {
        Dispute {
            id: object::new(ctx),
            dispute_id,
            campaign_id,
            content_id,
            initiator,
            respondent,
            dispute_type,
            status: DISPUTE_STATUS_FILED,
            description,
            initiator_evidence: evidence_urls,
            respondent_evidence: vector::empty(),
            resolution: option::none(),
            resolution_timestamp: option::none(),
            filed_timestamp,
            resolver_address: option::none(),
        }
    }

    // === Getter Functions ===

    public fun get_dispute_id(dispute: &Dispute): ID {
        object::uid_to_inner(&dispute.id)
    }

    public fun get_dispute_string_id(dispute: &Dispute): String {
        dispute.dispute_id
    }

    public fun get_dispute_campaign_id(dispute: &Dispute): ID {
        dispute.campaign_id
    }

    public fun get_dispute_content_id(dispute: &Dispute): Option<ID> {
        dispute.content_id
    }

    public fun get_dispute_initiator(dispute: &Dispute): address {
        dispute.initiator
    }

    public fun get_dispute_respondent(dispute: &Dispute): address {
        dispute.respondent
    }

    public fun get_dispute_type(dispute: &Dispute): u8 {
        dispute.dispute_type
    }

    public fun get_dispute_status(dispute: &Dispute): u8 {
        dispute.status
    }

    public fun get_dispute_description(dispute: &Dispute): String {
        dispute.description
    }

    public fun get_dispute_resolution(dispute: &Dispute): Option<String> {
        dispute.resolution
    }

    public fun get_dispute_filed_timestamp(dispute: &Dispute): u64 {
        dispute.filed_timestamp
    }

    public fun get_dispute_resolution_timestamp(dispute: &Dispute): Option<u64> {
        dispute.resolution_timestamp
    }

    public fun get_dispute_resolver_address(dispute: &Dispute): Option<address> {
        dispute.resolver_address
    }

    public fun get_initiator_evidence_count(dispute: &Dispute): u64 {
        vector::length(&dispute.initiator_evidence)
    }

    public fun get_respondent_evidence_count(dispute: &Dispute): u64 {
        vector::length(&dispute.respondent_evidence)
    }

    public fun get_initiator_evidence_at(dispute: &Dispute, index: u64): String {
        *vector::borrow(&dispute.initiator_evidence, index)
    }

    public fun get_respondent_evidence_at(dispute: &Dispute, index: u64): String {
        *vector::borrow(&dispute.respondent_evidence, index)
    }

    // === Status Helper Functions ===

    public fun dispute_type_payment(): u8 { DISPUTE_TYPE_PAYMENT }
    public fun dispute_type_content(): u8 { DISPUTE_TYPE_CONTENT }
    public fun dispute_type_contract(): u8 { DISPUTE_TYPE_CONTRACT }

    public fun dispute_status_filed(): u8 { DISPUTE_STATUS_FILED }
    public fun dispute_status_in_review(): u8 { DISPUTE_STATUS_IN_REVIEW }
    public fun dispute_status_resolved(): u8 { DISPUTE_STATUS_RESOLVED }
    public fun dispute_status_closed(): u8 { DISPUTE_STATUS_CLOSED }

    public fun is_dispute_resolved(dispute: &Dispute): bool {
        dispute.status == DISPUTE_STATUS_RESOLVED || dispute.status == DISPUTE_STATUS_CLOSED
    }

    public fun is_dispute_active(dispute: &Dispute): bool {
        dispute.status == DISPUTE_STATUS_FILED || dispute.status == DISPUTE_STATUS_IN_REVIEW
    }

    public fun can_submit_evidence(dispute: &Dispute): bool {
        dispute.status == DISPUTE_STATUS_FILED || dispute.status == DISPUTE_STATUS_IN_REVIEW
    }

    // === Test Only Functions ===
    
    #[test_only]
    public fun create_test_dispute(
        dispute_id: String,
        campaign_id: ID,
        initiator: address,
        respondent: address,
        dispute_type: u8,
        description: String,
        ctx: &mut TxContext
    ): Dispute {
        create_dispute(
            dispute_id,
            campaign_id,
            option::none(),
            initiator,
            respondent,
            dispute_type,
            description,
            vector::empty(),
            0,
            ctx
        )
    }

    #[test_only]
    public fun create_test_resolution_cap(
        resolver_address: address,
        ctx: &mut TxContext
    ): DisputeResolutionCap {
        DisputeResolutionCap {
            id: object::new(ctx),
            resolver_address,
        }
    }

    #[test_only]
    public fun set_dispute_status_for_testing(dispute: &mut Dispute, status: u8) {
        dispute.status = status;
    }

    #[test_only]
    public fun set_dispute_resolver_for_testing(dispute: &mut Dispute, resolver: address) {
        dispute.resolver_address = option::some(resolver);
    }
}