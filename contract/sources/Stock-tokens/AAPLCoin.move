module my_addr::AAPLCoin {
    use aptos_framework::fungible_asset::{
        Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset
    };
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use std::error;
    use std::signer;
    use std::string::utf8;
    use std::option;

    const E_NOT_ADMIN: u64 = 1;
    const ASSET_SYMBOL: vector<u8> = b"AAPL";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
        admin: address,
    }

    fun init_module(admin: &signer) {
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),
            utf8(b"Apple Stock Token"),
            utf8(ASSET_SYMBOL),
            6,
            utf8(b"https://example.com/aapl-icon.png"),
            utf8(b"https://example.com"),
        );

        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);

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

    public entry fun mint_coins(admin: &signer, to: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = ensure_admin_and_borrow(admin, asset);
        let fa: FungibleAsset = fungible_asset::mint(&managed.mint_ref, amount);
        primary_fungible_store::deposit(to, fa);
    }

    public entry fun burn_coins(admin: &signer, from: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = ensure_admin_and_borrow(admin, asset);

        let from_store = primary_fungible_store::primary_store(from, asset);
        let fa = fungible_asset::withdraw_with_ref(
            &managed.transfer_ref,
            from_store,
            amount,
        );
        fungible_asset::burn(&managed.burn_ref, fa);
    }

    public entry fun transfer_coins(admin: &signer, from: address, to: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed = ensure_admin_and_borrow(admin, asset);

        let from_store = primary_fungible_store::primary_store(from, asset);
        let fa = fungible_asset::withdraw_with_ref(
            &managed.transfer_ref,
            from_store,
            amount,
        );

        let to_store = primary_fungible_store::ensure_primary_store_exists(to, asset);
        fungible_asset::deposit_with_ref(
            &managed.transfer_ref,
            to_store,
            fa,
        );
    }

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

    public entry fun initialize(admin: &signer) {
        let metadata_address = object::create_object_address(&@my_addr, ASSET_SYMBOL);
        assert!(!object::object_exists<Metadata>(metadata_address), 1);
        
        init_module(admin);
    }
}