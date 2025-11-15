module my_addr::ExchangeV2 {
    use std::error;
    use std::signer;
    use std::string::{Self, String};

    //
    // Currency modules
    //
    use my_addr::INRCoin;
    use my_addr::CNYCoin;
    use my_addr::EURCoin;

    //
    // Stock token modules
    //
    use my_addr::GoogleCoin;
    use my_addr::APPLCoin;
    use my_addr::TSLACoin;
    use my_addr::NVDACoin;
    use my_addr::HOODCoin;

    //
    // Error codes
    //
    const E_NOT_ADMIN: u64 = 1;
    const E_UNKNOWN_CURRENCY: u64 = 2;
    const E_UNKNOWN_STOCK: u64 = 3;
    const E_INVALID_PRICE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;

    //
    // Ensure only platform admin (your @my_addr) can call core flows
    //
    inline fun assert_admin(admin: &signer) {
        assert!(
            signer::address_of(admin) == @my_addr,
            error::permission_denied(E_NOT_ADMIN)
        );
    }

    //
    // 🔹 BUY STOCK (multi-currency)
    // burn currency → mint stock
    //
    /// `currency`  = "INR" | "CNY" | "EUR"
    /// `stock`     = "GOOGC" | "APPL" | "TSLA" | "NVDA" | "HOOD"
    /// `currency_amount`, `price_in_currency` use 6 decimals (same as your tokens)
    /// `stock_amount = currency_amount / price_in_currency`
    public entry fun buy_stock(
        admin: &signer,
        user: address,
        currency: String,
        stock: String,
        currency_amount: u64,
        price_in_currency: u64,
    ) {
        assert_admin(admin);
        assert!(currency_amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(price_in_currency > 0, error::invalid_argument(E_INVALID_PRICE));

        let stock_amount = currency_amount / price_in_currency;
        assert!(stock_amount > 0, error::invalid_argument(E_INVALID_AMOUNT));

        //
        // 1️⃣ Burn the correct currency from user
        //
        if (currency == string::utf8(b"INR")) {
            INRCoin::burn_inrc(admin, user, currency_amount);

        } else if (currency == string::utf8(b"CNY")) {
            CNYCoin::burn_cny(admin, user, currency_amount);

        } else if (currency == string::utf8(b"EUR")) {
            EURCoin::burn_eur(admin, user, currency_amount);

        } else {
            abort error::invalid_argument(E_UNKNOWN_CURRENCY)
        };

        //
        // 2️⃣ Mint the correct stock token to user
        //
        if (stock == string::utf8(b"GOOGC")) {
            GoogleCoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"APPL")) {
            APPLCoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"TSLA")) {
            TSLACoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"NVDA")) {
            NVDACoin::mint_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"HOOD")) {
            HOODCoin::mint_stock_token(admin, user, stock_amount);

        } else {
            abort error::invalid_argument(E_UNKNOWN_STOCK)
        };
    }

    //
    // 🔹 SELL STOCK (multi-currency)
    // burn stock → mint currency
    //
    /// `currency_amount = stock_amount * price_in_currency`
    public entry fun sell_stock(
        admin: &signer,
        user: address,
        currency: String,
        stock: String,
        stock_amount: u64,
        price_in_currency: u64,
    ) {
        assert_admin(admin);
        assert!(stock_amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(price_in_currency > 0, error::invalid_argument(E_INVALID_PRICE));

        let currency_amount = stock_amount * price_in_currency;

        //
        // 1️⃣ Burn the correct stock token from user
        //
        if (stock == string::utf8(b"GOOGC")) {
            GoogleCoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"APPL")) {
            APPLCoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"TSLA")) {
            TSLACoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"NVDA")) {
            NVDACoin::burn_stock_token(admin, user, stock_amount);

        } else if (stock == string::utf8(b"HOOD")) {
            HOODCoin::burn_stock_token(admin, user, stock_amount);

        } else {
            abort error::invalid_argument(E_UNKNOWN_STOCK)
        };

        //
        // 2️⃣ Mint the correct currency to user
        //
        if (currency == string::utf8(b"INR")) {
            INRCoin::mint_inrc(admin, user, currency_amount);

        } else if (currency == string::utf8(b"CNY")) {
            CNYCoin::mint_cny(admin, user, currency_amount);

        } else if (currency == string::utf8(b"EUR")) {
            EURCoin::mint_eur(admin, user, currency_amount);

        } else {
            abort error::invalid_argument(E_UNKNOWN_CURRENCY)
        };
    }

    //
    // 📈 View helpers (for frontend math / quoting)
    //

    #[view]
    public fun calculate_buy_amount(currency_amount: u64, price_in_currency: u64): u64 {
        if (price_in_currency == 0) { 0 } else { currency_amount / price_in_currency }
    }

    #[view]
    public fun calculate_sell_amount(stock_amount: u64, price_in_currency: u64): u64 {
        stock_amount * price_in_currency
    }
}
