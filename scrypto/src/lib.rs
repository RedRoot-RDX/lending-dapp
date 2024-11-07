/* ------------------ Imports ----------------- */
mod shared;

use scrypto::prelude::*;
use shared::LazyVec;

/* ----------------- Blueprint ---------------- */
#[blueprint]
mod redroot {
    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
        },
        methods {
            add_asset => restrict_to: [admin];
            remove_asset => restrict_to: [admin];
        }
    }

    struct RedRoot {
        // Asset Storage
        asset_list: LazyVec<ResourceAddress>,
        vaults: KeyValueStore<ResourceAddress, Vault>,
    }

    impl RedRoot {
        /* --------------- Public Methods -------------- */
        pub fn instantiate() -> (Global<RedRoot>, Bucket) {
            // Reserve address
            let (address_reservation, component_address) = Runtime::allocate_component_address(RedRoot::blueprint_id());

            //. Authorization
            // Component Owner
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name"        => "RedRoot Owner Badge", locked;
                    "description" => "Badge representing the owner of the RedRoot lending platform", locked;
                }})
                .mint_initial_supply(1)
                .into();
            let owner_access_rule: AccessRule = rule!(require(owner_badge.resource_address()));

            // Admin Badge
            let admin_resource_manager: ResourceManager = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {init {
                    "name" => "", locked;
                    "description" => "", locked;
                }})
                .create_with_no_initial_supply();
            let admin_access_rule: AccessRule = rule!(require(admin_resource_manager.address()));

            //. Internal Data Setup
            let mut asset_list: LazyVec<ResourceAddress> = LazyVec::new();
            let asset_vaults: KeyValueStore<ResourceAddress, Vault> = KeyValueStore::new();

            // RedRoot
            let redroot_bucket: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_MAXIMUM)
                .metadata(metadata! {init {
                    "name"        => "RedRoot", locked;
                    "symbol"      => "RRT",     locked;
                    "description" => "",        locked;
                }})
                .mint_initial_supply(10000)
                .into();
            let redroot_vault: Vault = Vault::with_bucket(redroot_bucket);

            asset_list.append(redroot_vault.resource_address());
            asset_vaults.insert(redroot_vault.resource_address(), redroot_vault);

            // XRD
            let xrd_vault: Vault = Vault::new(XRD);

            asset_list.append(xrd_vault.resource_address());
            asset_vaults.insert(xrd_vault.resource_address(), xrd_vault);

            //. Component
            // Metadata
            let component_metadata = metadata! {
                roles {
                    metadata_setter         => OWNER;
                    metadata_setter_updater => OWNER;
                    metadata_locker         => OWNER;
                    metadata_locker_updater => rule!(deny_all);
                },
                init {
                    "name"        => "RedRoot Lending Platform", locked;
                    "description" => "Multi-collateralized lending platform", locked;
                }
            };

            // Roles
            let component_roles = roles! {
                admin => admin_access_rule.clone();
            };

            // Instantising
            let component_data: RedRoot = Self { asset_list, vaults: asset_vaults };

            let component: Global<RedRoot> = component_data
                .instantiate()
                .prepare_to_globalize(OwnerRole::Fixed(owner_access_rule.clone()))
                .roles(component_roles)
                .metadata(component_metadata)
                .with_address(address_reservation)
                .globalize();

            (component, owner_badge)
        }

        /// Adds a (fungible) asset into the asset list and create a corresponding vault
        pub fn add_asset(&mut self, asset: ResourceAddress) {
            // Validation
            assert!(!asset.is_fungible(), "Provided asset must be fungible.");
            assert!(self.validate_fungible(asset), "Cannot add asset {:?}, as it is already added and tracked", asset);

            // Update the asset list
            self.asset_list.append(asset);
            // If the asset does not already have a vault, create one
            if self.vaults.get(&asset).is_none() {
                self.vaults.insert(asset, Vault::new(asset));
            }
        }

        /// Removes a (fungible) asset from the asset list, but does not remove its vault
        // ! Asset can only be removed if vault empty; vault itself not deleted
        pub fn remove_asset(&mut self, asset: ResourceAddress) {
            // Validation
            assert!(!self.validate_fungible(asset), "Asset is invalid");

            let found = self.asset_list.find(&asset);
            if let Some(index) = found {
                assert!(
                    !self.vaults.get_mut(&asset).unwrap().is_empty(),
                    "Internal vault for the asset [{:?}] is not empty; cannot delete the asset.",
                    asset
                );

                // Remove the asset from the list
                self.asset_list.remove(&index);
                // TODO: find some way to release the funds from the vault when its removed
            } else {
                panic!("Cannot find asset [{:?}] in the asset list. It is likely not added.", asset);
            }
        }

        /* -------------- Private Methods ------------- */
        /// Checks
        fn validate_fungible(&self, addr: ResourceAddress) -> bool {
            info!("[validate_fungible] Validating asset with address {:?}", addr);

            if !addr.is_fungible() {
                info!("[validate_fungible] Asset {:?} is not fungible", addr);
                return false;
            }

            // Check that a vault exists for the given address
            if self.vaults.get(&addr).is_none() {
                info!("[validate_fungible] No vault found for asset {:?}", addr);
                return false;
            }

            // Check that the asset is tracked in the asset_list
            let found = self.asset_list.find(&addr).is_some();
            if !found {
                info!("[validate_fungible] Asset {:?} not tracked in the asset list", addr);
                return false;
            }

            // Return true if all checks passed
            info!("[validate_fungible] Asset {:?} successfully validated", addr);
            true
        }
    }
}
