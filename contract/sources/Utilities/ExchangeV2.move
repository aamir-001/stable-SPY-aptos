module my_addr::ExchangeV2 {
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

    /// Buy stock with currency
    /// Burns currency and mints stock tokens
    public entry fun buy_stock(
        admin: &signer,
        user: address,
        currency: String,
        stock: String,
        currency_amount: u64,
        price: u64
    ) {
        // Calculate stock amount to mint
        let stock_amount = currency_amount / price;
        assert!(stock_amount > 0, E_INVALID_AMOUNT);

        // Burn currency
        let currency_str = *std::string::bytes(&currency);
        if (currency_str == b"INR") {
            INRCoin::burn_coins(admin, user, currency_amount);
        } else if (currency_str == b"EUR") {
            EURCoin::burn_coins(admin, user, currency_amount);
        } else if (currency_str == b"CNY") {
            CNYCoin::burn_coins(admin, user, currency_amount);
        } else {
            abort E_UNKNOWN_CURRENCY
        };

        // Mint stock
        let stock_str = *std::string::bytes(&stock);
        if (stock_str == b"GOOG") {  // Changed from GOOGC
            GOOGCoin::mint_coins(admin, user, stock_amount);
        } else if (stock_str == b"AAPL") {  // Changed from APPL
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

    /// Sell stock for currency
    /// Burns stock tokens and mints currency
    public entry fun sell_stock(
        admin: &signer,
        user: address,
        currency: String,
        stock: String,
        stock_amount: u64,
        price: u64
    ) {
        assert!(stock_amount > 0, E_INVALID_AMOUNT);

        // Calculate currency amount to mint
        let currency_amount = stock_amount * price;

        // Burn stock
        let stock_str = *std::string::bytes(&stock);
        if (stock_str == b"GOOG") {  // Changed from GOOGC
            GOOGCoin::burn_coins(admin, user, stock_amount);
        } else if (stock_str == b"AAPL") {  // Changed from APPL
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

        // Mint currency
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
    }
}