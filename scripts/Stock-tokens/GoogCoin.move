module my_addr::GoogleCoin {
    use aptos_framework::fungible_asset::{
        Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset
    };
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use std::error;
    use std::signer;
    use std::string::utf8;
    use std::option;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;

    /// Symbol for GoogleCoin
    const ASSET_SYMBOL: vector<u8> = b"GOOGC";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
        admin: address,
    }

    /// Initialize metadata and refs (run once)
    fun init_module(admin: &signer) {
        // Create non-deletable named object for GoogleCoin
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);

        // Create FA metadata with name, symbol, decimals, icon, and project URI
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),                              // no max supply
            utf8(b"GoogleCoin"),                          // name
            utf8(ASSET_SYMBOL),                           // symbol
            6,                                            // decimals (supports fractional shares)
            utf8(b"https://example.com/google.png"),       // icon URI (placeholder)
            utf8(b"https://example.com"),                 // project URI
        );

        // Generate Mint, Transfer, Burn capabilities
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);

        // Store all refs and admin address
        let metadata_signer = object::generate_signer(constructor_ref);
        move_to(
            &metadata_signer,
            ManagedFungibleAsset {
                mint_ref,
                transfer_ref,
                burn_ref,
                admin: signer::address_of(admin),
            }
        );
    }

    //
    // 🔍 View functions
    //

    #[view]
    public fun get_metadata(): Object<Metadata> {
        let metadata_address = object::create_object_address(&@my_addr, ASSET_SYMBOL);
        object::address_to_object<Metadata>(metadata_address)
    }

    #[view]
    public fun balance_of(account: address): u64 {
        let asset = get_metadata();
        primary_fungible_store::balance(account, asset)
    }

    //
    // 🛠️ Admin functions (only admin can mint, burn, transfer)
    //

    /// Mint GoogleCoin to recipient’s account
    public entry fun mint_stock_token(admin: &signer, to: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = ensure_admin_and_borrow(admin, asset);

        let fa: FungibleAsset = fungible_asset::mint(&managed.mint_ref, amount);
        primary_fungible_store::deposit(to, fa);
    }

    /// Burn GoogleCoin from `from` address
    public entry fun burn_stock_token(admin: &signer, from: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = ensure_admin_and_borrow(admin, asset);

        let from_store = primary_fungible_store::primary_store(from, asset);
        let fa = fungible_asset::withdraw_with_ref(&managed.transfer_ref, from_store, amount);
        fungible_asset::burn(&managed.burn_ref, fa);
    }

    /// Admin-only transfer between users
    public entry fun transfer_stock_token(admin: &signer, from: address, to: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = ensure_admin_and_borrow(admin, asset);

        let from_store = primary_fungible_store::primary_store(from, asset);
        let fa = fungible_asset::withdraw_with_ref(&managed.transfer_ref, from_store, amount);

        let to_store = primary_fungible_store::ensure_primary_store_exists(to, asset);
        fungible_asset::deposit_with_ref(&managed.transfer_ref, to_store, fa);
    }

    //
    // 🧩 Internal helper
    //

    inline fun ensure_admin_and_borrow(
        admin_signer: &signer,
        asset: Object<Metadata>,
    ): &ManagedFungibleAsset {
        let managed_addr = object::object_address(&asset);
        let managed = borrow_global<ManagedFungibleAsset>(managed_addr);
        assert!(
            signer::address_of(admin_signer) == managed.admin,
            error::permission_denied(E_NOT_ADMIN)
        );
        managed
    }
}
