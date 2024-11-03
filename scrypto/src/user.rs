/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

/* ------------------ Structs ----------------- */
#[derive(Debug, NonFungibleData, ScryptoSbor, Clone)]
pub struct Borrower {
    #[mutable]
    collateral: AddrToAmount, // Potentially should be replaced with KeyValueStore
    #[mutable]
    debt: Decimal,
}
