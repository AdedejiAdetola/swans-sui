// 5. dispute.move
// Purpose: Dispute management and resolution.

// Put in this file:

// Dispute struct
// open_dispute function
// add_dispute_evidence function
// resolve_dispute function
// Dispute-specific helper/view functions
// (Optional) Dispute event structs



module swans::dispute {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    
    use swans::registry::{Self, PlatformRegistry};
    use swans::campaign::{Self, Campaign};
    use swans::types::{Self, DisputeStatus};

    // ===== Dispute Struct =====
    public struct Dispute has key {
        id: UID,
        dispute_id: String,
        campaign_id: String,
        creator_id: String,
        brand_address: address,
        creator_address: address,
        initiated_by: address,
        status: DisputeStatus,
        dispute_type: String, // "payment", "content", "contract_violation", etc.
        description: String,
        brand_evidence: String,
        creator_evidence: String,
        creation_timestamp: u64,
        resolution_timestamp: Option<u64>,
        resolution_notes: String,
        resolved_by: Option<address>,
    }

    // ===== Events =====
    public struct DisputeOpened has copy, drop {
        dispute_id: String,
        campaign_id: String,
        creator_id: String,
        initiated_by: address,
        dispute_type: String,
    }

    public struct DisputeEvidenceAdded has copy, drop {
        dispute_id: String,
        submitted_by: address,
        evidence_type: String, // "brand" or "creator"
    }

    public struct DisputeResolved has copy, drop {
        dispute_id: String,
        resolved_by: address,
        resolution_notes: String,
    }

    // ===== Dispute Management =====

    /// Open a dispute
    public entry fun open_dispute(
        campaign: &Campaign,
        dispute_id: String,
        creator_id: String,
        dispute_type: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify the sender has authority to open dispute
        assert!(sender == campaign::get_brand_owner(campaign) || 
                campaign::has_applied(campaign, creator_id), types::err_not_authorized());

        // Get creator address (in a real implementation, we'd look this up from registry)
        let creator_address = sender; // Simplified for demo

        let dispute = Dispute {
            id: object::new(ctx),
            dispute_id,
            campaign_id: campaign::get_campaign_id(campaign),
            creator_id,
            brand_address: campaign::get_brand_owner(campaign),
            creator_address,
            initiated_by: sender,
            status: types::new_dispute_status(types::dispute_open()),
            dispute_type,
            description,
            brand_evidence: string::utf8(b""),
            creator_evidence: string::utf8(b""),
            creation_timestamp: clock::timestamp_ms(clock),
            resolution_timestamp: option::none(),
            resolution_notes: string::utf8(b""),
            resolved_by: option::none(),
        };

        event::emit(DisputeOpened {
            dispute_id: dispute.dispute_id,
            campaign_id: dispute.campaign_id,
            creator_id: dispute.creator_id,
            initiated_by: sender,
            dispute_type,
        });

        transfer::share_object(dispute);
    }

    /// Add evidence to dispute
    public entry fun add_dispute_evidence(
        dispute: &mut Dispute,
        evidence: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == dispute.brand_address || sender == dispute.creator_address, types::err_not_authorized());
        assert!(types::dispute_status_value(&dispute.status) == types::dispute_open(), types::err_invalid_status());

        let evidence_type = if (sender == dispute.brand_address) {
            dispute.brand_evidence = evidence;
            string::utf8(b"brand")
        } else {
            dispute.creator_evidence = evidence;
            string::utf8(b"creator")
        };

        event::emit(DisputeEvidenceAdded {
            dispute_id: dispute.dispute_id,
            submitted_by: sender,
            evidence_type,
        });
    }

    /// Update dispute status (for involved parties to update before admin resolution)
    public entry fun update_dispute_status(
        dispute: &mut Dispute,
        new_status: u8,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == dispute.brand_address || sender == dispute.creator_address, types::err_not_authorized());
        assert!(types::dispute_status_value(&dispute.status) == types::dispute_open(), types::err_invalid_status());
        
        // Only allow transition to cancelled status by the parties involved
        assert!(new_status == types::dispute_cancelled(), types::err_invalid_status());
        
        dispute.status = types::new_dispute_status(new_status);
    }

    /// Resolve dispute (admin function)
    public entry fun resolve_dispute(
        registry: &PlatformRegistry,
        dispute: &mut Dispute,
        resolution_notes: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let admin = registry::get_admin(registry);
        assert!(tx_context::sender(ctx) == admin, types::err_not_authorized());
        assert!(types::dispute_status_value(&dispute.status) == types::dispute_open(), types::err_invalid_status());

        dispute.status = types::new_dispute_status(types::dispute_resolved());
        dispute.resolution_notes = resolution_notes;
        dispute.resolution_timestamp = option::some(clock::timestamp_ms(clock));
        dispute.resolved_by = option::some(admin);

        event::emit(DisputeResolved {
            dispute_id: dispute.dispute_id,
            resolved_by: admin,
            resolution_notes,
        });
    }

    /// Close dispute (for parties to mutually close)
    public entry fun close_dispute_by_agreement(
        dispute: &mut Dispute,
        agreement_notes: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == dispute.brand_address || sender == dispute.creator_address, types::err_not_authorized());
        assert!(types::dispute_status_value(&dispute.status) == types::dispute_open(), types::err_invalid_status());

        dispute.status = types::new_dispute_status(types::dispute_resolved());
        dispute.resolution_notes = agreement_notes;
        dispute.resolution_timestamp = option::some(clock::timestamp_ms(clock));
        dispute.resolved_by = option::some(sender);

        event::emit(DisputeResolved {
            dispute_id: dispute.dispute_id,
            resolved_by: sender,
            resolution_notes: agreement_notes,
        });
    }

    /// Escalate dispute (mark for admin attention)
    public entry fun escalate_dispute(
        dispute: &mut Dispute,
        escalation_reason: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == dispute.brand_address || sender == dispute.creator_address, types::err_not_authorized());
        assert!(types::dispute_status_value(&dispute.status) == types::dispute_open(), types::err_invalid_status());

        // Update description to include escalation reason
        dispute.description = string::utf8(b"ESCALATED: ");
        string::append(&mut dispute.description, escalation_reason);
    }

    // ===== Query Functions =====

    /// Check if dispute is open
    public fun is_dispute_open(dispute: &Dispute): bool {
        types::dispute_status_value(&dispute.status) == types::dispute_open()
    }

    /// Check if dispute is resolved
    public fun is_dispute_resolved(dispute: &Dispute): bool {
        types::dispute_status_value(&dispute.status) == types::dispute_resolved()
    }

    /// Check if user can participate in dispute
    public fun can_participate_in_dispute(dispute: &Dispute, addr: address): bool {
        dispute.brand_address == addr || dispute.creator_address == addr
    }

    /// Get dispute age in milliseconds
    public fun get_dispute_age(dispute: &Dispute, clock: &Clock): u64 {
        clock::timestamp_ms(clock) - dispute.creation_timestamp
    }

    // ===== View Functions =====

    public fun get_dispute_id(dispute: &Dispute): String {
        dispute.dispute_id
    }

    public fun get_campaign_id(dispute: &Dispute): String {
        dispute.campaign_id
    }

    public fun get_creator_id(dispute: &Dispute): String {
        dispute.creator_id
    }

    public fun get_dispute_status(dispute: &Dispute): u8 {
        types::dispute_status_value(&dispute.status)
    }

    public fun get_dispute_type(dispute: &Dispute): String {
        dispute.dispute_type
    }

    public fun get_description(dispute: &Dispute): String {
        dispute.description
    }

    public fun get_brand_evidence(dispute: &Dispute): String {
        dispute.brand_evidence
    }

    public fun get_creator_evidence(dispute: &Dispute): String {
        dispute.creator_evidence
    }

    public fun get_initiated_by(dispute: &Dispute): address {
        dispute.initiated_by
    }

    public fun get_creation_timestamp(dispute: &Dispute): u64 {
        dispute.creation_timestamp
    }

    public fun get_resolution_timestamp(dispute: &Dispute): Option<u64> {
        dispute.resolution_timestamp
    }

    public fun get_resolution_notes(dispute: &Dispute): String {
        dispute.resolution_notes
    }

    public fun get_resolved_by(dispute: &Dispute): Option<address> {
        dispute.resolved_by
    }

    public fun get_brand_address(dispute: &Dispute): address {
        dispute.brand_address
    }

    public fun get_creator_address(dispute: &Dispute): address {
        dispute.creator_address
    }
}