/* ------------------ Imports ----------------- */
// Modules
mod utils;
// Usages
use scrypto::prelude::*;
use utils::{LazyVec, Pool, TPool};

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
struct RemoveAssetEvent {
    asset: ResourceAddress,
}

/* ----------------- Blueprint ---------------- */
#[blueprint]
#[events(InstantiseEvent, AddAssetEvent)]
mod redroot {
    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
        },
        methods {
            add_asset    => restrict_to: [OWNER, admin];
            remove_asset => restrict_to: [OWNER, admin];
        }
    }

    struct Redroot {
        // Authorization
        global_component_caller_badge: NonFungibleGlobalId,
        owner_badge: ResourceAddress,
        admin_resource_manager: ResourceManager,
        // Asset Storage
        asset_list: LazyVec<ResourceAddress>,
        vaults: KeyValueStore<ResourceAddress, Vault>,
        pools: KeyValueStore<ResourceAddress, Pool>,
    }

    impl Redroot {
        /* --------------- Public Methods -------------- */
        pub fn instantiate(dapp_definition_address: ComponentAddress) -> (Global<Redroot>, Bucket) {
            // Reserve address
            let (address_reservation, component_address) = Runtime::allocate_component_address(Redroot::blueprint_id());

            //. Authorization
            // Component
            let global_component_caller_badge = NonFungibleGlobalId::global_caller_badge(component_address);
            let global_component_access_rule: AccessRule = rule!(require(global_component_caller_badge.clone()));

            // Component Owner
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "Redroot Owner Badge", locked;
                    "description" => "Badge representing the owner of the Redroot lending platform", locked;
                }})
                .mint_initial_supply(1)
                .into();
            let owner_access_rule: AccessRule = rule!(require(owner_badge.resource_address()));

            // Admin Badge
            let admin_resource_manager: ResourceManager = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "", locked;
                    "description" => "", locked;
                }})
                .mint_roles(mint_roles! {
                    minter         => global_component_access_rule.clone();
                    minter_updater => rule!(deny_all);
                })
                .recall_roles(recall_roles! {
                    recaller         => global_component_access_rule.clone();
                    recaller_updater => rule!(deny_all);
                })
                .burn_roles(burn_roles! {
                    burner         => global_component_access_rule.clone();
                    burner_updater => rule!(deny_all);
                })
                .create_with_no_initial_supply();
            let admin_access_rule: AccessRule = rule!(require(admin_resource_manager.address()));

            //. Internal Data Setup
            let mut asset_list: LazyVec<ResourceAddress> = LazyVec::new();
            let vaults: KeyValueStore<ResourceAddress, Vault> = KeyValueStore::new();
            let pools: KeyValueStore<ResourceAddress, Pool> = KeyValueStore::new();

            // Redroot
            // ! TEMPORARY: Used for testing
            let redroot_bucket: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_MAXIMUM)
                .metadata(metadata! {init {
                    "name"        => "Redroot", locked;
                    "symbol"      => "RRT", locked;
                    "description" => "", locked;
                }})
                .mint_initial_supply(10000)
                .into();
            let redroot_address = redroot_bucket.resource_address().clone();

            let redroot_vault: Vault = Vault::with_bucket(redroot_bucket);
            let (redroot_pool, redroot_pool_unit) = Redroot::create_pool(OwnerRole::Fixed(owner_access_rule.clone()), global_component_access_rule.clone(), redroot_address, "RRT");
            let redroot_pool = Pool::new(redroot_pool, redroot_pool.address(), redroot_pool_unit);

            asset_list.append(redroot_vault.resource_address());
            vaults.insert(redroot_address, redroot_vault);
            pools.insert(redroot_address, redroot_pool);

            // XRD
            let xrd_vault: Vault = Vault::new(XRD);
            let (xrd_pool, xrd_pool_unit) = Redroot::create_pool(OwnerRole::Fixed(owner_access_rule.clone()), global_component_access_rule.clone(), XRD, "XRD");
            let xrd_pool = Pool::new(xrd_pool, xrd_pool.address(), xrd_pool_unit);

            asset_list.append(XRD);
            vaults.insert(XRD, xrd_vault);
            pools.insert(XRD, xrd_pool);

            //. Component
            let asset_list_vec: Vec<ResourceAddress> = asset_list.to_vec();

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

            // Component instantisation
            let component_data: Redroot = Self {
                // Authorization
                global_component_caller_badge,
                owner_badge: owner_badge.resource_address(),
                admin_resource_manager,
                // Asset Storage
                asset_list,
                vaults,
                pools,
            };

            let component: Global<Redroot> = component_data
                .instantiate()
                .prepare_to_globalize(OwnerRole::Fixed(owner_access_rule.clone()))
                .roles(component_roles)
                .metadata(component_metadata)
                .with_address(address_reservation)
                .globalize();

            // Call instantisation event
            Runtime::emit_event(InstantiseEvent { component_address: component.address(), asset_list: asset_list_vec });

            // Return
            (component, owner_badge)
        }

        /// Adds a (fungible) asset into the asset list and create a corresponding vault
        pub fn add_asset(&mut self, asset: ResourceAddress) {
            info!("[Redroot:add_asset] Adding asset: {:?}", asset);
            // Validation
            assert!(asset.is_fungible(), "Provided asset must be fungible.");
            assert!(!self.validate_fungible(asset), "Cannot add asset {:?}, as it is already added and tracked", asset);

            // Update the asset list
            self.asset_list.append(asset);
            // If the asset does not already have a vault, create one
            if self.vaults.get(&asset).is_none() {
                info!("[Redroot:add_asset] Creating vault for asset: {:?}", asset);
                self.vaults.insert(asset, Vault::new(asset));

                info!("[Redroot:add_asset] Creating pool for asset: {:?}", asset);
                let (pool, pool_unit) = Redroot::create_pool(
                    OwnerRole::Fixed(rule!(require(self.owner_badge.clone()))),
                    rule!(require(self.global_component_caller_badge.clone())),
                    asset,
                    "TEMP-ASSET",
                );
                let pool = Pool::new(pool, pool.address(), pool_unit);

                self.pools.insert(asset, pool);
            }

            // Fire AddAssetEvent
            let pool = self.pools.get(&asset).unwrap();
            Runtime::emit_event(AddAssetEvent { asset, pool_address: pool.pool_address, pool_unit_address: pool.pool_unit });
        }

        /// Removes a (fungible) asset from the asset list, but does not remove its vault
        // ! Asset can only be removed if vault empty; vault itself not deleted
        pub fn remove_asset(&mut self, asset: ResourceAddress) {
            info!("[Redroot:remove_asset] Removing asset: {:?}", asset);
            // Validation
            assert!(self.validate_fungible(asset), "Asset with address {:?} is invalid", asset);

            let found = self.asset_list.find(&asset);
            if let Some(index) = found {
                assert!(
                    self.vaults.get_mut(&asset).unwrap().is_empty(),
                    "Internal vault for the asset {:?} is not empty; cannot delete the asset.",
                    asset
                );

                // TODO: find some way to release the funds from the vault when its removed
                // Remove the asset from the list
                self.asset_list.remove(&index);

                // Fire RemoveAssetEvent
                Runtime::emit_event(RemoveAssetEvent { asset });
            } else {
                panic!("Cannot find asset {:?} in the asset list. It is likely not added.", asset);
            }
        }

        /* -------------- Private Methods ------------- */
        /// Checks that the given asset is generally valid, is in the asset_list, and has a corresponding vault
        fn validate_fungible(&self, addr: ResourceAddress) -> bool {
            info!("[Redroot:validate_fungible] Validating asset with address {:?}", addr);

            if !addr.is_fungible() {
                info!("[Redroot:validate_fungible] INVALID: Asset {:?} is not fungible", addr);
                return false;
            }

            // Check that a vault exists for the given address
            if self.vaults.get(&addr).is_none() {
                info!("[Redroot:validate_fungible] INVALID: No vault found for asset {:?}", addr);
                return false;
            }

            // Check that the asset is tracked in the asset_list
            let found = self.asset_list.find(&addr);
            if found.is_none() {
                info!("[Redroot:validate_fungible] INVALID: Asset {:?} not tracked in the asset list", addr);
                return false;
            }
            info!("[Redroot:validate_fungible] Asset found at index: {:?}", found);

            // Return true if all checks passed
            info!("[Redroot:validate_fungible] VALID: Asset {:?} successfully validated", addr);
            true
        }

        /// Create a pool for an asset
        // TODO: Implement the asset_name somehow
        fn create_pool(owner_role: OwnerRole, pool_manager_role: AccessRule, asset: ResourceAddress, asset_name: &str) -> (TPool, GlobalAddress) {
            info!("[create_pool] Creating pool for asset: {:?}", asset);
            info!("[create_pool] Asset name: {:?}", asset_name);

            // Validation
            assert!(asset.is_fungible(), "Asset with address {:?} is not fungible", asset);

            // Create the pool
            let pool = Blueprint::<OneResourcePool>::instantiate(owner_role, pool_manager_role, asset, None);
            let pool_metadata_pu: Option<GlobalAddress> = pool.get_metadata("pool_unit").expect("Unable to get pool unit address");

            if let Some(pool_unit) = pool_metadata_pu {
                info!("[create_pool] Pool unit: {:?}", pool_unit);

                (pool, pool_unit)
            } else {
                panic!("Unable to get pool unit address");
            }
        }
    }
}
