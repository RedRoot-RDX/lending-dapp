/* ------------------ Imports ----------------- */
use scrypto::prelude::*;
use std::collections::HashMap;

/* ------------------- Types ------------------ */
pub type AddrToAmount = HashMap<ResourceAddress, Decimal>;
pub type LazySet<T> = KeyValueStore<T, ()>;
