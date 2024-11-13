/* ------------------ Imports ----------------- */
// Usages
use crate::asset::{Asset, ADDRESSES};
use crate::pool::{Pool, TPool};
use crate::position::Position;
use crate::utils::{LazyVec, ValueMap};
use scrypto::prelude::*;

/* ------------------ Events ------------------ */
#[derive(ScryptoSbor, ScryptoEvent)]
struct InstantiseEvent {
    component_address: ComponentAddress,
    asset_list: Vec<ResourceAddress>,
    // vaults:            KeyValueStore<ResourceAddress, Vault>,
    // pools:             KeyValueStore<ResourceAddress, Pool>,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct AddAssetEvent {
    asset: ResourceAddress,
    pool_address: ComponentAddress,
    pool_unit_address: GlobalAddress,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct TrackAssetEvent {
    asset: ResourceAddress,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct UntrackAssetEvent {
    asset: ResourceAddress,
}

/* ----------------- Blueprint ---------------- */
#[blueprint]
#[events(InstantiseEvent, AddAssetEvent, TrackAssetEvent, UntrackAssetEvent)]
// Types registered to reduce fees; include those used for KV stores, structs, NFTs, etc.
#[types(Decimal, ResourceAddress, ComponentAddress, GlobalAddress, Asset, TPool, Pool, Position)]
mod redroot {
    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
        },
        methods {
            // Position management
            open_position     => PUBLIC;
            position_supply   => PUBLIC;
            position_borrow   => PUBLIC;
            position_withdraw => PUBLIC;
            position_repay    => PUBLIC;
            // Asset management
            add_asset     => restrict_to: [SELF, OWNER];
            track_asset   => restrict_to: [SELF, OWNER, admin];
            untrack_asset => restrict_to: [SELF, OWNER, admin];
            // Pool management

            // Price stream management
            link_price_stream   => restrict_to: [SELF, OWNER];
            unlink_price_stream => restrict_to: [SELF, OWNER];
            // Utility methods
            log_asset_list => PUBLIC;
            log_assets     => PUBLIC;
        }
    }

    struct Redroot {
        component_address: ComponentAddress,

        owner_badge_address: ResourceAddress,
        admin_manager: ResourceManager,

        asset_list: LazyVec<ResourceAddress>, // List of all 'tracked' assets; serves as a filter out of all added assets
        assets: KeyValueStore<ResourceAddress, Asset>,

        price_stream: Option<Global<AnyComponent>>,

        position_manager: ResourceManager,
        open_positions: u64,
    }

    impl Redroot {
        pub fn instantiate(
            dapp_definition_address: ComponentAddress,
            // ! -------- TESTING --------
            test_assets: Vec<ResourceAddress>,
            // ! -/-/-/-/-/-/-/-/-/-/-/-/-
        ) -> (Global<Redroot>, Bucket) {
            // Reserve address
            let (address_reservation, component_address) = Runtime::allocate_component_address(Redroot::blueprint_id());

            //. Badges and rules
            // Component
            let component_access_rule: AccessRule = rule!(require(global_caller(component_address)));

            // Component owner
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "Redroot Owner Badge", locked;
                    "description" => "Badge representing the owner of the Redroot lending platform", locked;
                }})
                .mint_initial_supply(1)
                .into();
            let owner_access_rule: AccessRule = rule!(require(owner_badge.resource_address()));
            let owner_role: OwnerRole = OwnerRole::Fixed(owner_access_rule.clone());

            // Admin badge
            // TODO: replace with non-fungible
            let admin_manager: ResourceManager = ResourceBuilder::new_fungible(owner_role.clone())
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "", locked;
                    "description" => "", locked;
                }})
                .mint_roles(mint_roles! {
                    minter         => component_access_rule.clone();
                    minter_updater => rule!(deny_all);
                })
                .recall_roles(recall_roles! {
                    recaller         => component_access_rule.clone();
                    recaller_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner         => component_access_rule.clone();
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();
            let admin_access_rule: AccessRule = rule!(require(admin_manager.address()));

            // Position badge
            let position_manager: ResourceManager = ResourceBuilder::new_integer_non_fungible::<Position>(owner_role.clone())
                .metadata(metadata! {init {
                    "name"        => "Redroot Seed", locked;
                    "description" => "Badge representing a position in the Redroot lending platform", locked;
                }})
                .mint_roles(mint_roles! {
                    minter         => component_access_rule.clone();
                    minter_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner         => component_access_rule.clone();
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();

            //. Internal data setup
            // Initialise component data
            let mut component_data: Redroot = Self {
                component_address,
                owner_badge_address: owner_badge.resource_address(),
                admin_manager,
                asset_list: LazyVec::new(),
                assets: KeyValueStore::new(),
                price_stream: None,
                position_manager,
                open_positions: 0u64,
            };

            // Add all assets
            let mut assets: Vec<ResourceAddress> = ADDRESSES.clone().to_vec();
            let owner_proof = owner_badge.create_proof_of_all();

            // ! -------- TESTING --------
            for address in test_assets {
                assets.push(address);
            }
            // ! -/-/-/-/-/-/-/-/-/-/-/-/-

            for address in assets {
                let asset = Redroot::add_asset(&mut component_data, address);

                // ! Set pool unit metadata; has to be done manually for assets not in the instantisation asset list
                let pool_unit_rm: ResourceManager = ResourceManager::from_address(asset.pool.pool_unit.clone());

                let meta_name = format!("Redroot {} Pool Unit", asset.name).to_string();
                let meta_symbol = format!("$rrt{}", asset.symbol).to_string();
                let meta_description = format!("Redroot pool unit for the {} pool", asset.symbol).to_string();

                info!("Pre-auth");
                owner_proof.authorize(|| {
                    pool_unit_rm.set_metadata("name", meta_name);
                    pool_unit_rm.set_metadata("symbol", meta_symbol);
                    pool_unit_rm.set_metadata("description", meta_description);
                });
                info!("Post-auth");
            }

            //. Component
            let asset_list: Vec<ResourceAddress> = component_data.asset_list.to_vec();

            // Metadata
            let component_metadata = metadata! {
                roles {
                    metadata_setter         => OWNER;
                    metadata_setter_updater => OWNER;
                    metadata_locker         => OWNER;
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name"            => "Redroot Lending Platform", locked;
                    "description"     => "Multi-collateralized lending platform", locked;
                    "dapp_definition" => dapp_definition_address, updatable;
                }
            };

            // Roles
            let component_roles = roles! {
                admin => admin_access_rule.clone();
            };

            // Instantisation
            let component: Global<Redroot> = component_data
                .instantiate()
                .prepare_to_globalize(owner_role)
                .roles(component_roles)
                .metadata(component_metadata)
                .with_address(address_reservation)
                .globalize();

            // Call instantisation event
            Runtime::emit_event(InstantiseEvent { component_address: component.address(), asset_list });

            // Return
            (component, owner_badge)
        }

        //. ------------ Position Management ----------- /
        pub fn open_position(&mut self, supply: Vec<Bucket>) {
            // Sanity checks
            let (valid, supply): (bool, Vec<Bucket>) = self.validate_buckets_not_empty(supply);
            assert!(valid, "Some supplied resource is invalid, check logs");

            let (valuemap, supply): (ValueMap, Vec<Bucket>) = self.buckets_to_value_map(supply);
            let position: Position = Position::create(valuemap);

            // TODO: call position_supply
        }

        pub fn position_supply(&mut self, supply: Vec<Bucket>) {
            // Sanity checks
            let (valid, supply) = self.validate_buckets_not_empty(supply);
            assert!(valid, "Some supplied resource is invalid, check logs");

            // Check if user has an NFT
            info!("[position_supply] Global Caller: {:?}", GLOBAL_CALLER_VIRTUAL_BADGE);
            info!("[position_supply] Component: {:?}", self.component_address);
        }

        pub fn position_borrow(&mut self, borrow: Vec<Bucket>) {
            todo!()
        }

        pub fn position_withdraw(&mut self, asset: Bucket) {
            todo!()
        }

        pub fn position_repay(&mut self, asset: Bucket) {
            todo!()
        }

        //. ------------- Asset Operations ------------- /

        //. --------------- Asset Listing -------------- /
        /// Add a fungible asset into the market, and output a FungibleAsset struct
        pub fn add_asset(&mut self, address: ResourceAddress) -> Asset {
            info!("[add_asset] Adding asset: {:?}", address);

            // assert_eq!(self.owner_badge_address, owner_badge.resource_address(), "Owner badge must be provided");

            // Validation
            assert!(address.is_fungible(), "Provided asset must be fungible.");
            assert!(self.assets.get(&address).is_none(), "Asset already has an entry");
            // assert!(self.pools.get(&address).is_none(), "Asset already has a pool");
            assert!(!self.validate_fungible(address), "Cannot add asset {:?}, as it is already added and tracked", address);

            // Pool owned by: Redroot owner
            // Pool managed by: Redroot owner or component calls
            let pool_owner = OwnerRole::Fixed(rule!(require(self.owner_badge_address)));
            let pool_manager = rule!(require(global_caller(self.component_address)) || require(self.owner_badge_address));
            let pool = Pool::create(pool_owner, pool_manager, address);

            // ! Cannot automatically set proof metadata because of "Moving restricted proof downstream"
            // Set pool unit metadata
            // let pool_unit_rm: ResourceManager = ResourceManager::from_address(pool.pool_unit.clone());

            // let meta_name = format!("Redroot {} Pool Unit", asset.name).to_string();
            // let meta_symbol = format!("$rrt{}", asset.symbol).to_string();
            // let meta_description = format!("Redroot pool unit for the {} pool", asset.symbol).to_string();

            // info!("Pre-auth");
            // LocalAuthZone::push(owner_badge.clone());

            // owner_badge.authorize(|| {
            //     pool_unit_rm.set_metadata("name", meta_name);
            //     pool_unit_rm.set_metadata("symbol", meta_symbol);
            //     pool_unit_rm.set_metadata("description", meta_description);
            // });
            // info!("Post-auth");

            // Create FungibleAsset
            let asset = Asset::new(address, pool);
            info!("[add_asset] FungibleAsset: {:#?}", asset);

            // Fire AddAssetEvent
            Runtime::emit_event(AddAssetEvent {
                asset: address,
                pool_address: asset.pool.address,
                pool_unit_address: asset.pool.pool_unit_global,
            });

            // self.pools.insert(address, pool);
            self.assets.insert(address, asset.clone());
            self.track_asset(address);

            asset
        }

        /// Add an asset into the asset list
        pub fn track_asset(&mut self, asset: ResourceAddress) {
            info!("[track_asset] Tracking asset {:?}", asset);

            // Sanity checks
            assert!(!self.validate_fungible(asset), "Cannot add asset {:?}, as it is already added and tracked", asset);
            assert!(asset.is_fungible(), "Provided asset must be fungible.");
            assert!(self.assets.get(&asset).is_some(), "No asset entry for {:?}, run add_asset first", asset);
            // assert!(self.pools.get(&asset).is_some(), "No pool for asset {:?}, run add_asset first", asset);

            // Append the asset into the asset list
            self.asset_list.append(asset);
        }

        /// Removes an asset from the asset list
        pub fn untrack_asset(&mut self, asset: ResourceAddress) {
            info!("[untrack_asset] Removing asset: {:?}", asset);

            // Sanity checks
            assert!(self.validate_fungible(asset), "Asset with address {:?} is invalid", asset);

            // Remove asset
            let found = self.asset_list.find(&asset);
            if let Some(index) = found {
                // Remove the asset from the list
                self.asset_list.remove(&index);

                // Fire RemoveAssetEvent
                Runtime::emit_event(UntrackAssetEvent { asset });
            } else {
                panic!("Cannot find asset {:?} in the asset list. It is likely not added.", asset);
            }
        }

        //. ---------- Price Stream Management --------- /
        pub fn link_price_stream(&mut self, price_stream: Global<AnyComponent>) {
            self.price_stream = Some(price_stream);
        }

        pub fn unlink_price_stream(&mut self) {
            self.price_stream = None;
        }

        //. -------------- Utility Methods ------------- /
        // ! Testing Methods
        pub fn log_asset_list(&self) {
            info!("[log_asset_list] Asset list: {:#?}", self.asset_list.to_vec());
        }

        pub fn log_assets(&self) {
            for (i, address, _) in self.asset_list.iter() {
                if let Some(asset) = self.assets.get(&address) {
                    info!("[log_assets] Data for asset {:?}:", address);
                    info!("[log_assets] {:#?}", asset.clone());
                } else {
                    info!("[log_assets] Asset with address {:?} not found", address);
                }
            }
        }

        /// Checks that the given asset is generally valid, is in the asset_list, and has a corresponding vault
        fn validate_fungible(&self, address: ResourceAddress) -> bool {
            if !address.is_fungible() {
                info!("[validate_fungible] INVALID: Asset {:?} is not fungible", address);
                return false;
            }

            // Check that a vault exists for the given address
            if self.assets.get(&address).is_none() {
                info!("[validate_fungible] INVALID: No asset entry found for {:?}", address);
                return false;
            }

            // Check that the asset is tracked in the asset_list
            let found = self.asset_list.find(&address);
            if found.is_none() {
                info!("[validate_fungible] INVALID: Asset {:?} not tracked in the asset list", address);
                return false;
            }

            // Return true if all checks passed
            info!("[validate_fungible] VALID: Asset {:?} successfully validated", address);
            true
        }

        /// Checks that all resources provided in the buckets are valid
        fn validate_buckets(&self, buckets: Vec<Bucket>) -> (bool, Vec<Bucket>) {
            for bucket in &buckets {
                if !self.validate_fungible(bucket.resource_address()) {
                    return (false, buckets);
                }

                if bucket.amount() <= dec!(0.0) {
                    return (false, buckets);
                }
            }

            (true, buckets)
        }

        /// Checks that all presources provided in the buckets are valid and not empty
        fn validate_buckets_not_empty(&self, buckets: Vec<Bucket>) -> (bool, Vec<Bucket>) {
            for bucket in &buckets {
                if bucket.amount() <= dec!(0.0) {
                    return (false, buckets);
                }

                if !self.validate_fungible(bucket.resource_address()) {
                    return (false, buckets);
                }
            }

            (true, buckets)
        }

        /// Calculates the USD values of all provided asset from the oracle
        // ! Uses a mock price stream
        // TODO: provide epoch to ensure data not out-of-date
        fn get_asset_values(&self, assets: ValueMap) -> (Decimal, ValueMap) {
            let mut usd_values = KeyValueStore::new();
            let mut total = dec!(0.0);

            (total, usd_values)
        }

        /// Generate a value map from a vector of buckets
        fn buckets_to_value_map(&self, buckets: Vec<Bucket>) -> (ValueMap, Vec<Bucket>) {
            let mut kv: ValueMap = KeyValueStore::new();

            for bucket in &buckets {
                kv.insert(bucket.resource_address(), bucket.amount());
            }

            (kv, buckets)
        }
    }
}
