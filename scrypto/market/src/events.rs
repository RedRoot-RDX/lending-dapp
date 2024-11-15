/* ------------------ Imports ----------------- */
use crate::utils::{ValueMap, ValueTuple};
use scrypto::prelude::*;

/* ------------------ Market ------------------ */
//. General
#[derive(ScryptoSbor, ScryptoEvent)]
pub struct InstantiseEvent {
    pub component_address: ComponentAddress,
    pub asset_list: Vec<ResourceAddress>,
}

//. Position management
#[derive(ScryptoSbor, ScryptoEvent)]
pub struct OpenPositionEvent {
    pub position_id: NonFungibleLocalId,

    pub supply: ValueMap,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct PositionSupplyEvent {
    pub position_id: NonFungibleLocalId,

    pub provided: ValueMap,

    pub supply: ValueMap,
    pub pool_units: ValueMap,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct PositionBorrowEvent {
    pub position_id: NonFungibleLocalId,

    pub requested: ValueMap,

    pub debt: ValueMap,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct PositionWithdrawEvent {
    pub position_id: NonFungibleLocalId,

    pub provided_pool_unit: ValueTuple,

    pub supply: ValueMap,
    pub withdrawn: ValueTuple,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct PositionRepayEvent {
    pub position_id: NonFungibleLocalId,

    pub repaid: ValueTuple,

    pub debt: ValueMap,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct PositionCloseEvent {}

//. Internal position operations
#[derive(ScryptoSbor, ScryptoEvent)]
pub struct PositionHealthEvent {
    pub health: PreciseDecimal,
}

//. Asset management
#[derive(ScryptoSbor, ScryptoEvent)]
pub struct AddAssetEvent {
    pub asset: ResourceAddress,
    pub pool_address: ComponentAddress,
    pub pool_unit_address: GlobalAddress,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct TrackAssetEvent {
    pub asset: ResourceAddress,
}

#[derive(ScryptoSbor, ScryptoEvent)]
pub struct UntrackAssetEvent {
    pub asset: ResourceAddress,
}
