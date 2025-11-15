module my_addr::Exchange {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use aptos_std::simple_map::{Self, SimpleMap};
    use my_addr::INRCoin;
    use my_addr::GoogleCoin;
    use my_addr::APPLCoin;
    use my_addr::TSLACoin;
    use my_addr::NVDACoin;
    use my_addr::HOODCoin;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_UNKNOWN_STOCK: u64 = 2;
    const E_UNKNOWN_CURRENCY: u64 = 3;
    const E_NOT_INITIALIZED: u64 = 4;
    const E_ALREADY_INITIALIZED: u64 = 5;

    /// Mock conversion rate: 1 GOOGC = 100 INR (for MVP) - DEPRECATED
    const PRICE_PER_STOCK_INR: u64 = 100;

    struct PriceRegistry has key {
        prices: SimpleMap<String, u64>,
        admin: address,
    }

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        assert!(
            !exists<PriceRegistry>(@my_addr),
            error::already_exists(E_ALREADY_INITIALIZED)
        );

        let prices = simple_map::create<String, u64>();
        
        simple_map::add(&mut prices, string::utf8(b"GOOGC"), 100);
        simple_map::add(&mut prices, string::utf8(b"APPL"), 150);
        simple_map::add(&mut prices, string::utf8(b"TSLA"), 200);
        simple_map::add(&mut prices, string::utf8(b"NVDA"), 300);
        simple_map::add(&mut prices, string::utf8(b"HOOD"), 50);

        move_to(
            admin,
            PriceRegistry {
                prices,
                admin: admin_addr,
            }
        );
    }

    #[deprecated]
    public entry fun buy_stock(
        admin: &signer,
        user: address,
        inrc_amount: u64
    ) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @my_addr, error::permission_denied(E_NOT_ADMIN));

        INRCoin::burn_inrc(admin, user, inrc_amount);
        let googc_amount = inrc_amount / PRICE_PER_STOCK_INR;
        GoogleCoin::mint_stock_token(admin, user, googc_amount);
    }

    #[deprecated]
    public entry fun sell_stock(
        admin: &signer,
        user: address,
        googc_amount: u64
    ) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @my_addr, error::permission_denied(E_NOT_ADMIN));

        GoogleCoin::burn_stock_token(admin, user, googc_amount);
        let inrc_amount = googc_amount * PRICE_PER_STOCK_INR;
        INRCoin::mint_inrc(admin, user, inrc_amount);
    }

    #[view]
    public fun get_conversion_rate(): u64 {
        PRICE_PER_STOCK_INR
    }

    public entry fun update_stock_price(
        admin: &signer,
        stock_symbol: String,
        new_price: u64
    ) acquires PriceRegistry {
        let registry = borrow_global_mut<PriceRegistry>(@my_addr);
        assert!(signer::address_of(admin) == registry.admin, error::permission_denied(E_NOT_ADMIN));
        assert!(simple_map::contains_key(&registry.prices, &stock_symbol), error::not_found(E_UNKNOWN_STOCK));

        let price_ref = simple_map::borrow_mut(&mut registry.prices, &stock_symbol);
        *price_ref = new_price;
    }

    public entry fun buy_stock_v2(
        admin: &signer,
        user: address,
        stock_symbol: String,
        inr_amount: u64
    ) acquires PriceRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @my_addr, error::permission_denied(E_NOT_ADMIN));

        let registry = borrow_global<PriceRegistry>(@my_addr);
        assert!(simple_map::contains_key(&registry.prices, &stock_symbol), error::not_found(E_UNKNOWN_STOCK));

        let price = *simple_map::borrow(&registry.prices, &stock_symbol);
        let stock_amount = inr_amount / price;

        INRCoin::burn_inrc(admin, user, inr_amount);

        if (stock_symbol == string::utf8(b"GOOGC")) {
            GoogleCoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"APPL")) {
            APPLCoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"TSLA")) {
            TSLACoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"NVDA")) {
            NVDACoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"HOOD")) {
            HOODCoin::mint_stock_token(admin, user, stock_amount);

        } else {
            abort error::invalid_argument(E_UNKNOWN_STOCK)
        };
    }

    public entry fun sell_stock_v2(
        admin: &signer,
        user: address,
        stock_symbol: String,
        stock_amount: u64
    ) acquires PriceRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @my_addr, error::permission_denied(E_NOT_ADMIN));

        let registry = borrow_global<PriceRegistry>(@my_addr);
        assert!(simple_map::contains_key(&registry.prices, &stock_symbol), error::not_found(E_UNKNOWN_STOCK));

        let price = *simple_map::borrow(&registry.prices, &stock_symbol);
        let inr_amount = stock_amount * price;

        if (stock_symbol == string::utf8(b"GOOGC")) {
            GoogleCoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"APPL")) {
            APPLCoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"TSLA")) {
            TSLACoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"NVDA")) {
            NVDACoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock_symbol == string::utf8(b"HOOD")) {
            HOODCoin::burn_stock_token(admin, user, stock_amount);

        } else {
            abort error::invalid_argument(E_UNKNOWN_STOCK)
        };

        INRCoin::mint_inrc(admin, user, inr_amount);
    }

    #[view]
    public fun get_stock_price(stock_symbol: String): u64 acquires PriceRegistry {
        let registry = borrow_global<PriceRegistry>(@my_addr);
        if (simple_map::contains_key(&registry.prices, &stock_symbol)) {
            *simple_map::borrow(&registry.prices, &stock_symbol)
        } else { 0 }
    }

    #[view]
    public fun is_stock_registered(stock_symbol: String): bool acquires PriceRegistry {
        let registry = borrow_global<PriceRegistry>(@my_addr);
        simple_map::contains_key(&registry.prices, &stock_symbol)
    }

    #[view]
    public fun calculate_buy_amount(stock_symbol: String, inr_amount: u64): u64 acquires PriceRegistry {
        let price = get_stock_price(stock_symbol);
        if (price == 0) { 0 } else { inr_amount / price }
    }

    #[view]
    public fun calculate_sell_amount(stock_symbol: String, stock_amount: u64): u64 acquires PriceRegistry {
        let price = get_stock_price(stock_symbol);
        stock_amount * price
    }
}
