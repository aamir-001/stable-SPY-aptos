module my_addr::ExchangeV3 {
    use std::signer;
    use std::string::String;
    use aptos_framework::coin;

    // Import all coin modules with correct names
    use my_addr::INRCoin;
    use my_addr::EURCoin;
    use my_addr::CNYCoin;
    use my_addr::GOOGCoin;  // Changed from GoogleCoin
    use my_addr::AAPLCoin;  // Changed from APPLCoin
    use my_addr::TSLACoin;
    use my_addr::NVDACoin;
    use my_addr::HOODCoin;

    // Error codes
    const E_INVALID_AMOUNT: u64 = 0x10005;
    const E_UNKNOWN_STOCK: u64 = 0x10003;
    const E_UNKNOWN_CURRENCY: u64 = 0x10004;

    /// Buy stock with currency (with transaction fee)
    /// Burns currency and mints stock tokens
    /// Fee is transferred to admin wallet before the purchase
    public entry fun buy_stock(
        admin: &signer,
        user: address,
        currency: String,
        stock: String,
        currency_amount: u64,
        price: u64,
        fee_amount: u64,
        admin_wallet: address
    ) {
        let currency_str = *std::string::bytes(&currency);

        // Step 1: Transfer fee from user to admin wallet (if fee > 0)
        if (fee_amount > 0) {
            if (currency_str == b"INR") {
                INRCoin::burn_coins(admin, user, fee_amount);
                INRCoin::mint_coins(admin, admin_wallet, fee_amount);
            } else if (currency_str == b"EUR") {
                EURCoin::burn_coins(admin, user, fee_amount);
                EURCoin::mint_coins(admin, admin_wallet, fee_amount);
            } else if (currency_str == b"CNY") {
                CNYCoin::burn_coins(admin, user, fee_amount);
                CNYCoin::mint_coins(admin, admin_wallet, fee_amount);
            } else {
                abort E_UNKNOWN_CURRENCY
            };
        };

        // Step 2: Calculate stock amount to mint from remaining currency
        let stock_amount = currency_amount / price;
        assert!(stock_amount > 0, E_INVALID_AMOUNT);

        // Step 3: Burn remaining currency for stock purchase
        if (currency_str == b"INR") {
            INRCoin::burn_coins(admin, user, currency_amount);
        } else if (currency_str == b"EUR") {
            EURCoin::burn_coins(admin, user, currency_amount);
        } else if (currency_str == b"CNY") {
            CNYCoin::burn_coins(admin, user, currency_amount);
        } else {
            abort E_UNKNOWN_CURRENCY
        };

        // Step 4: Mint stock to user
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

    /// Sell stock for currency (with transaction fee)
    /// Burns stock tokens and mints currency
    /// Fee is transferred to admin wallet after minting currency to user
    public entry fun sell_stock(
        admin: &signer,
        user: address,
        currency: String,
        stock: String,
        stock_amount: u64,
        price: u64,
        fee_amount: u64,
        admin_wallet: address
    ) {
        assert!(stock_amount > 0, E_INVALID_AMOUNT);

        // Step 1: Calculate currency amount to mint
        let currency_amount = stock_amount * price;

        // Step 2: Burn stock tokens from user
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

        // Step 3: Mint full currency amount to user
        let currency_str = *std::string::bytes(&currency);
        if (currency_str == b"INR") {
            INRCoin::mint_coins(admin, user, currency_amount);
        } else if (currency_str == b"EUR") {
            EURCoin::mint_coins(admin, user, currency_amount);
        } else if (currency_str == b"CNY") {
            CNYCoin::mint_coins(admin, user, currency_amount);
        } else {
            abort E_UNKNOWN_CURRENCY
        };

        // Step 4: Transfer fee from user to admin wallet (if fee > 0)
        if (fee_amount > 0) {
            if (currency_str == b"INR") {
                INRCoin::burn_coins(admin, user, fee_amount);
                INRCoin::mint_coins(admin, admin_wallet, fee_amount);
            } else if (currency_str == b"EUR") {
                EURCoin::burn_coins(admin, user, fee_amount);
                EURCoin::mint_coins(admin, admin_wallet, fee_amount);
            } else if (currency_str == b"CNY") {
                CNYCoin::burn_coins(admin, user, fee_amount);
                CNYCoin::mint_coins(admin, admin_wallet, fee_amount);
            } else {
                abort E_UNKNOWN_CURRENCY
            };
        };
    }
}
