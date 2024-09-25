use scrypto::prelude::*;

type LazySet<K> = KeyValueStore<K, ()>;

#[derive(NonFungibleData, ScryptoSbor, Clone)]
struct Borrower {
    collateral: Vec<Decimal>,
    loan_amount: Decimal,
}

#[blueprint]
mod radish {
    enable_method_auth! {
        roles {
            borrower => updatable_by: [OWNER];
        },
        methods {
            estimate_loan => PUBLIC;
            get_loan => PUBLIC;
            repay_loan => restrict_to: [borrower];
        }
    }

    struct Radish {
        // Radish Resources
        radish_manager: ResourceManager,
        radish_resource: ResourceAddress,
        radish_vault: Vault,
        // Borrower Resources
        borrower_manager: ResourceManager,
        borrowers: LazySet<NonFungibleGlobalId>,
        collateral_vaults: KeyValueStore<ResourceAddress, Vault>,
        // Badges
        // ...
        // Placeholder Oracle
        placeholder_oracle_collateral_prices: KeyValueStore<ResourceAddress, Decimal>, // Resource -> USD
    }

    impl Radish {
        pub fn instantise_radish() -> (Global<Radish>, Bucket) {
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
            let borrower_manager: ResourceManager = ResourceBuilder::new_integer_non_fungible::<Borrower>(OwnerRole::None)
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
                .create_with_no_initial_supply();

            let collateral_vaults = KeyValueStore::new();
            collateral_vaults.insert(XRD, Vault::new(XRD));
            

            /* ------------ Placeholder Oracle ------------ */
            let placeholder_oracle_collateral_prices = KeyValueStore::new();
            placeholder_oracle_collateral_prices.insert(radish_bucket.resource_address(), dec!(2.0));
            placeholder_oracle_collateral_prices.insert(XRD, dec!(0.02099)); // OCISWAP 


            /* --------------- Instantising --------------- */
            let component = Radish {
                // Radish Resources
                radish_manager: radish_bucket.resource_manager(),
                radish_resource: radish_bucket.resource_address(),
                radish_vault: Vault::with_bucket(radish_bucket),
                // Borrower Resources
                borrower_manager,
                borrowers: KeyValueStore::new(),
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
            .with_address(address_reservation)
            .globalize();

            (component, owner_badge)
        }

        pub fn estimate_loan(&self, collateral: Vec<Bucket>) -> Decimal {
            info!("[estimate_loan] collateral: {}", collateral);

            // Function Validation
            assert!(self.placeholder_oracle_collateral_prices.get(&self.radish_resource).is_some(), "RSH price not tracked by oracle");

            for bucket in &collateral {
                assert!(self.collateral_vaults.get(&bucket.resource_address()).is_some(), "Invalid resource provided as collateral");
                assert!(self.placeholder_oracle_collateral_prices.get(&bucket.resource_address()).is_some(), "Invalid oracle does not track provided collateral price");
                assert!(bucket.amount() >= Decimal::ZERO, "Bucket somehow less than 0");
            }

            let mut estimated_usd: Decimal = dec!(0.0);

            for bucket in &collateral {
                estimated_usd += bucket.amount() * *self.placeholder_oracle_collateral_prices.get(&bucket.resource_address()).unwrap();
            }
            
            let estimated_rsh: Decimal = estimated_usd / *self.placeholder_oracle_collateral_prices.get(&self.radish_resource).unwrap();
            
            info!("Collateral in USD: {}\nCollateral in RSH: {}", estimated_usd, estimated_rsh);
            estimated_rsh
        }

        pub fn get_loan(&mut self, mut collateral: Vec<Bucket>) {

        }

        pub fn repay_loan(&mut self) {}
    }
}