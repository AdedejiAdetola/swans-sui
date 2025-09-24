/// Swans Campaign Management System - Main Library
/// 
/// This is the main entry point for the Swans campaign management smart contracts.
/// It re-exports all public functions and types from the various modules.
module swans::lib {
    // Main library module - currently empty but will contain re-exports of other modules
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