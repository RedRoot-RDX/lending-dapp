/* ------------------ Imports ----------------- */
// Modules
mod shared;
mod user;
// Usages
use scrypto::prelude::*;
use shared::{AddrToAmount, LazySet};
use user::Borrower;

/* ------------------ Events ------------------ */
#[derive(ScryptoSbor, ScryptoEvent)]
struct EstimateLoanEvent {
    value: Decimal,
}

#[derive(ScryptoSbor, ScryptoEvent)]
struct EstimateRepayEvent {
    released: AddrToAmount,
}

/* ----------------- Blueprint ---------------- */
#[blueprint]
#[events(EstimateLoanEvent, EstimateRepayEvent)]
mod radish {
    enable_method_auth! {
        roles {
            borrower => updatable_by: [OWNER];
        },
        methods {
            estimate_loan => PUBLIC;
            get_loan => PUBLIC;
            estimate_repay => PUBLIC;
            repay_loan => PUBLIC;
        }
    }

    struct Radish {
        // Radish Resources
        radish_manager: ResourceManager,
        radish_resource: ResourceAddress,
        radish_vault: Vault,
        // Borrower Resources
        borrower_manager: ResourceManager,
        borrowers: LazySet<ComponentAddress>,
        // collateral_addresses: Vec<ResourceAddress>, //! May have to re-enable later
        collateral_vaults: KeyValueStore<ResourceAddress, Vault>,
        // Badges
        // ...
        // Placeholder Oracle
        placeholder_oracle_collateral_prices: KeyValueStore<ResourceAddress, Decimal>, // Resource -> USD
    }

    impl Radish {
        pub fn instantise_radish(
            USDT: ResourceAddress,
            HUG: ResourceAddress,
        ) -> (Global<Radish>, Bucket) {
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(Radish::blueprint_id());

            /* ------------------ Badges ------------------ */
            let owner_badge: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .metadata(metadata!(init {
                    "name" => "Radish Lending Platform Owner Badge", locked;
                }))
                .divisibility(DIVISIBILITY_NONE)
                .mint_initial_supply(1)
                .into();

            /* ----------------- Resources ---------------- */
            // Radish
            let radish_bucket: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .metadata(metadata!(init {
                    "name" => "Radish", locked;
                    "symbol" => "RSH", locked;
                    // "description" => "Radish provided by the Radish Lending Platform", locked;
                }))
                .mint_roles(mint_roles! {
                    minter => rule!(require(global_caller(component_address)));
                    minter_updater => rule!(deny_all);
                })
                .mint_initial_supply(10000)
                .into();

            // Borrower
            let borrower_manager: ResourceManager = ResourceBuilder::new_ruid_non_fungible::<
                Borrower,
            >(OwnerRole::None)
            .metadata(metadata!(init {
                "name" => "Radish Borrower Badge", locked;
            }))
            .mint_roles(mint_roles! {
                minter => rule!(require(global_caller(component_address)));
                minter_updater => rule!(deny_all);
            })
            .recall_roles(recall_roles! {
                recaller => rule!(require(global_caller(component_address)));
                recaller_updater => rule!(deny_all);
            })
            .burn_roles(burn_roles! {
                burner => rule!(require(global_caller(component_address)));
                burner_updater => rule!(deny_all);
            })
            .non_fungible_data_update_roles(non_fungible_data_update_roles! {
                non_fungible_data_updater => rule!(require(global_caller(component_address)));
                non_fungible_data_updater_updater => rule!(deny_all);
            })
            .create_with_no_initial_supply();

            let collateral_addresses = vec![XRD, USDT, HUG];
            let collateral_vaults = KeyValueStore::new();

            for address in &collateral_addresses {
                collateral_vaults.insert(address.clone(), Vault::new(address.clone()));
            }

            /* ------------ Placeholder Oracle ------------ */
            let placeholder_oracle_collateral_prices = KeyValueStore::new();
            placeholder_oracle_collateral_prices
                .insert(radish_bucket.resource_address(), dec!(2.0));
            // Price data from OCISWAP at the time of writing
            placeholder_oracle_collateral_prices.insert(XRD, dec!(0.02126));
            placeholder_oracle_collateral_prices.insert(USDT, dec!(1.0));
            placeholder_oracle_collateral_prices.insert(HUG, dec!(0.0000109));

            /* --------------- Instantising --------------- */
            let component = Radish {
                // Radish Resources
                radish_manager: radish_bucket.resource_manager(),
                radish_resource: radish_bucket.resource_address(),
                radish_vault: Vault::with_bucket(radish_bucket),
                // Borrower Resources
                borrower_manager,
                borrowers: KeyValueStore::new(),
                // collateral_addresses,
                collateral_vaults,
                // Badges
                // ...
                // Placeholder Oracle
                placeholder_oracle_collateral_prices,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::Fixed(rule!(require(
                owner_badge.resource_address()
            ))))
            .roles(roles!(
                borrower => rule!(require(borrower_manager.address()));
            ))
            .with_address(address_reservation)
            .globalize();

            (component, owner_badge)
        }

        // HashMap alright here since max 3-4 K-V pairs passed
        pub fn estimate_loan(&self, collateral: AddrToAmount) -> Decimal {
            info!("[estimate_loan] collateral: {:?}", collateral);

            /* ---------------- Validation ---------------- */
            assert!(collateral.len() > 0, "No resources provided");
            assert!(
                self.placeholder_oracle_collateral_prices
                    .get(&self.radish_resource)
                    .is_some(),
                "RSH price not tracked by oracle"
            );

            for (address, amount) in collateral.iter() {
                assert!(
                    self.collateral_vaults.get(address).is_some(),
                    "Invalid resource provided as collateral"
                );
                assert!(
                    self.placeholder_oracle_collateral_prices
                        .get(address)
                        .is_some(),
                    "Invalid oracle does not track provided collateral price"
                );
                assert!(amount >= &Decimal::ZERO, "Bucket somehow less than 0");
            }

            /* ------------------- Logic ------------------ */
            let mut estimated_usd: Decimal = dec!(0.0);

            for (address, amount) in collateral.iter() {
                let usd_value: Decimal = amount
                    .clone()
                    .checked_mul(
                        *self
                            .placeholder_oracle_collateral_prices
                            .get(address)
                            .unwrap(),
                    )
                    .unwrap();

                estimated_usd = estimated_usd.checked_add(usd_value).unwrap();
            }

            let estimated_rsh: Decimal = estimated_usd
                .checked_div(
                    *self
                        .placeholder_oracle_collateral_prices
                        .get(&self.radish_resource)
                        .unwrap(),
                )
                .unwrap();

            /* ------------------ Return ------------------ */
            info!(
                "[estimate_loan] Collateral in USD: {:?}\n[estimate_loan] Collateral in RSH: {:?}",
                estimated_usd, estimated_rsh
            );

            Runtime::emit_event(EstimateLoanEvent {
                value: estimated_rsh.clone(),
            });
            estimated_rsh
        }

        // Prevents user from taking out a second loan
        // pub fn get_loan(&mut self, account_address: ComponentAddress, collateral: Vec<Bucket>) -> (Bucket, Bucket) {
        //     assert!(self.borrowers.get(&account_address).is_none(), "Loan already acquired");

        // Vec alright here since max 3-4 values passed
        pub fn get_loan(&mut self, collateral: Vec<Bucket>) -> (Bucket, Bucket) {
            assert!(collateral.len() > 0, "No buckets provided");

            info!(
                "[get_loan] Collateral: {:?} {:?}",
                &collateral,
                &collateral[0].amount()
            );

            let resource_map: AddrToAmount = collateral
                .iter()
                .map(|bucket| (bucket.resource_address(), bucket.amount()))
                .collect();
            let estimated_rsh: Decimal = self.estimate_loan(resource_map.clone());

            assert!(
                self.radish_vault.amount() >= estimated_rsh,
                "Insufficient RSH in vault to provide loan"
            );

            let borrower_badge: Bucket = self.borrower_manager.mint_ruid_non_fungible(Borrower {
                collateral: resource_map,
                debt: estimated_rsh.clone(),
            });
            info!("[get_loan] borrower badge: {:?}", borrower_badge);

            for bucket in collateral {
                let mut resource_vault = self
                    .collateral_vaults
                    .get_mut(&bucket.resource_address())
                    .unwrap();
                resource_vault.put(bucket);
            }

            (borrower_badge, self.radish_vault.take(estimated_rsh))
        }

        pub fn estimate_repay(
            &self,
            borrower_id: NonFungibleLocalId,
            repayment: Decimal,
        ) -> AddrToAmount {
            // assert_eq!(borrower_proof.amount(), Decimal::ONE, "Only a single borrower badge must be provided");
            // assert_eq!(borrower_proof.resource_address(), self.borrower_manager.address(), "Invalid borrower badge");
            assert!(
                self.borrower_manager.non_fungible_exists(&borrower_id),
                "Invalid borrower badge id provided"
            );
            assert!(
                repayment > Decimal::ZERO,
                "Cannot provide less than 0 Radish for repayment"
            );

            // let borrower_data = borrower_proof.as_non_fungible().non_fungible::<Borrower>().data();

            // let borrower_data = borrower_id
            //     .check_with_message(self.borrower_manager.address(), "Invalid borrower badge")
            //     .non_fungible::<Borrower>()
            //     .data();

            let borrower_data = self
                .borrower_manager
                .get_non_fungible_data::<Borrower>(&borrower_id);

            // If loan fully repaid with potential excess
            if repayment >= borrower_data.debt {
                let estimate = borrower_data.collateral;

                info!(
                    "[estimate_repay] Estimated repay with excess: {:?}",
                    &estimate
                );
                Runtime::emit_event(EstimateRepayEvent {
                    released: estimate.clone(),
                });
                estimate
            } else {
                let repayment_ratio = repayment.checked_div(borrower_data.debt).unwrap();
                let estimate: AddrToAmount = borrower_data
                    .collateral
                    .iter()
                    .map(|(address, amount)| {
                        (*address, amount.checked_mul(repayment_ratio).unwrap())
                    })
                    .collect();

                info!(
                    "[estimate_repay] Estimated partial repay with ratio {:?}: {:?}",
                    &repayment_ratio, &estimate
                );
                Runtime::emit_event(EstimateRepayEvent {
                    released: estimate.clone(),
                });
                estimate
            }
        }

        pub fn repay_loan(&mut self, borrower_nft: Bucket, mut repayment: Bucket) -> Vec<Bucket> {
            assert!(
                repayment.amount() > Decimal::ZERO,
                "Cannot provide less than 0 Radish for repayment"
            );
            assert_eq!(
                borrower_nft.amount(),
                Decimal::ONE,
                "Only a single borrower badge must be provided"
            );
            assert_eq!(
                borrower_nft.resource_address(),
                self.borrower_manager.address(),
                "Invalid borrower badge"
            );

            let borrower_data = borrower_nft
                .as_non_fungible()
                .non_fungible::<Borrower>()
                .data();
            let borrower_id = borrower_nft.as_non_fungible().non_fungible_local_id();
            let released_collateral = self.estimate_repay(borrower_id.clone(), repayment.amount());
            info!(
                "[repay_loan] Releasing collateral: {:?}",
                &released_collateral
            );

            let mut released: Vec<Bucket> = Vec::new();
            for (address, amount) in released_collateral.clone() {
                assert!(
                    self.collateral_vaults.get(&address).is_some(),
                    "No collateral vault for resource {:?}",
                    address
                );
                assert!(
          self.collateral_vaults.get(&address).unwrap().amount() >= amount,
          "Insufficient collateral in vault for resource {:?} to pay out {:?} ({:?} stored)",
          address,
          amount,
          self.collateral_vaults.get(&address).unwrap().amount()
        );

                let bucket = self
                    .collateral_vaults
                    .get_mut(&address)
                    .unwrap()
                    .take(amount);
                released.push(bucket);
            }

            if repayment.amount() >= borrower_data.debt {
                let overflow =
                    repayment.take(repayment.amount().checked_sub(borrower_data.debt).unwrap());
                info!("Full/overflow repay. overflow: {:?}", &overflow);
                released.push(overflow);

                borrower_nft.burn();
            } else {
                info!("Partial repay pre {:?}", &borrower_data);

                let new_collateral: AddrToAmount = borrower_data
                    .collateral
                    .iter()
                    .map(|(&address, &amount)| {
                        (
                            address,
                            amount
                                .checked_sub(*released_collateral.get(&address).unwrap())
                                .unwrap(),
                        )
                    })
                    .collect();
                let new_debt = borrower_data.debt.checked_sub(repayment.amount()).unwrap();

                self.borrower_manager.update_non_fungible_data(
                    &borrower_id,
                    "collateral",
                    new_collateral,
                );
                self.borrower_manager
                    .update_non_fungible_data(&borrower_id, "debt", new_debt);

                info!("Partial repay post {:?}", &borrower_data);
                released.push(borrower_nft);
            }

            self.radish_vault.put(repayment);
            released
        }
    }
}
