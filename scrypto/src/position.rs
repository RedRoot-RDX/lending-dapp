/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

use crate::utils::ValueMap;

/* ------------------- Badge ------------------ */
#[derive(NonFungibleData, ScryptoSbor)]
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
}
