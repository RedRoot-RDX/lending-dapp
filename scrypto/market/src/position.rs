/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

use crate::utils::ValueMap;

/* ------------------- Badge ------------------ */
#[derive(NonFungibleData, ScryptoSbor, Debug)]
pub struct Position {
    #[mutable]
    pub supply: ValueMap,
    #[mutable]
    pub debt: ValueMap,
}

impl Position {
    pub fn new() -> Self {
        Position { supply: ValueMap::new(), debt: ValueMap::new() }
    }

    pub fn create(supply: ValueMap) -> Self {
        Position { supply, debt: ValueMap::new() }
    }
}
