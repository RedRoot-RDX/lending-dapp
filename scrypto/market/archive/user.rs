/* ------------------ Imports ----------------- */
// Modules
// Usages
use crate::shared::*;
use scrypto::prelude::*;

/* ------------------ Structs ----------------- */
#[derive(Debug, NonFungibleData, ScryptoSbor, Clone)]
pub struct Borrower {
    #[mutable]
    pub collateral: AddrToAmount, // Potentially should be replaced with KeyValueStore
    #[mutable]
    pub debt: Decimal,
}
