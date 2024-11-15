/* ------------------ Imports ----------------- */
use crate::utils::ValueMap;
use scrypto::prelude::*;

/* ------------------- Badge ------------------ */
#[derive(NonFungibleData, ScryptoSbor, Debug)]
pub struct Position {
    #[mutable]
    pub supply: ValueMap,
    #[mutable]
    pub debt: ValueMap,
}

impl Position {
    pub fn new(supply: ValueMap) -> Self {
        Position { supply, debt: ValueMap::new() }
    }
}
