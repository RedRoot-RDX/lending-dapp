/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

/* ------------------- Pool ------------------- */
pub type TPool = Global<OneResourcePool>;

#[derive(ScryptoSbor)]
pub struct Pool {
    pub pool: TPool,
    pub pool_address: ComponentAddress,
    pub pool_unit: ResourceAddress,
    pub pool_unit_global: GlobalAddress,
}

impl Pool {
    pub fn new(pool: TPool, pool_address: ComponentAddress, pool_unit: ResourceAddress, pool_unit_global: GlobalAddress) -> Self {
        Pool { pool, pool_address, pool_unit, pool_unit_global }
    }
}
