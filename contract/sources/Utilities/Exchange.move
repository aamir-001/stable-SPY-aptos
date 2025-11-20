module my_addr::Exchange {
    use std::signer;
    use std::string::String;

    // Import all coin modules with correct names
    use my_addr::INRCoin;
    use my_addr::GOOGCoin;
    use my_addr::AAPLCoin;
    use my_addr::TSLACoin;
    use my_addr::NVDACoin;
    use my_addr::HOODCoin;

    // Error codes
    const E_INVALID_AMOUNT: u64 = 0x10005;
    const E_UNKNOWN_STOCK: u64 = 0x10003;

    /// Mint GOOG tokens (legacy function - kept for compatibility)
    public entry fun mint_googc(
        admin: &signer,
        user: address,
        googc_amount: u64
    ) {
        GOOGCoin::mint_coins(admin, user, googc_amount);
    }

    /// Burn GOOG tokens (legacy function - kept for compatibility)
    public entry fun burn_googc(
        admin: &signer,
        user: address,
        googc_amount: u64
    ) {
        GOOGCoin::burn_coins(admin, user, googc_amount);
    }

    /// Buy stock with INR (legacy function)
    public entry fun buy_stock(
        admin: &signer,
        user: address,
        stock: String,
        currency_amount: u64,
        price: u64
    ) {
        let stock_amount = currency_amount / price;
        assert!(stock_amount > 0, E_INVALID_AMOUNT);

        // Burn INR
        INRCoin::burn_coins(admin, user, currency_amount);

        // Mint stock
        let stock_str = *std::string::bytes(&stock);
        if (stock_str == b"GOOG") {
            GOOGCoin::mint_coins(admin, user, stock_amount);
        } else if (stock_str == b"AAPL") {
            AAPLCoin::mint_coins(admin, user, stock_amount);
        } else if (stock_str == b"TSLA") {
            TSLACoin::mint_coins(admin, user, stock_amount);
        } else if (stock_str == b"NVDA") {
            NVDACoin::mint_coins(admin, user, stock_amount);
        } else if (stock_str == b"HOOD") {
            HOODCoin::mint_coins(admin, user, stock_amount);
        } else {
            abort E_UNKNOWN_STOCK
        };
    }

    /// Sell stock for INR (legacy function)
    public entry fun sell_stock(
        admin: &signer,
        user: address,
        stock: String,
        stock_amount: u64,
        price: u64
    ) {
        assert!(stock_amount > 0, E_INVALID_AMOUNT);

        let currency_amount = stock_amount * price;

        // Burn stock
        let stock_str = *std::string::bytes(&stock);
        if (stock_str == b"GOOG") {
            GOOGCoin::burn_coins(admin, user, stock_amount);
        } else if (stock_str == b"AAPL") {
            AAPLCoin::burn_coins(admin, user, stock_amount);
        } else if (stock_str == b"TSLA") {
            TSLACoin::burn_coins(admin, user, stock_amount);
        } else if (stock_str == b"NVDA") {
            NVDACoin::burn_coins(admin, user, stock_amount);
        } else if (stock_str == b"HOOD") {
            HOODCoin::burn_coins(admin, user, stock_amount);
        } else {
            abort E_UNKNOWN_STOCK
        };

        // Mint INR
        INRCoin::mint_coins(admin, user, currency_amount);
    }
}