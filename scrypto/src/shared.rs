/* ------------------ Imports ----------------- */
use scrypto::prelude::*;

/* ------------------- Types ------------------ */
pub type LazySet<T> = KeyValueStore<T, ()>;
