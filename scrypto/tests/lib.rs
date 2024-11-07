/* ------------------ Imports ----------------- */
use ::redroot::redroot_test::*;
use scrypto_test::prelude::*;

/* ------------------- Misc. ------------------ */
struct Account {
    public_key: Secp256k1PublicKey,
    private_key: Secp256k1PrivateKey,
    addr: ComponentAddress,
}

/* ------------------- Tests ------------------ */
#[test]
fn instantisation_test() -> Result<(), RuntimeError> {
    //. Simulation Setup
    let mut ledger: LedgerSimulator<NoExtension, InMemorySubstateDatabase> = LedgerSimulatorBuilder::new().build();

    //. Account Setup
    // Main Account
    let (public_key, private_key, account) = ledger.new_allocated_account();
    let main_account = Account { public_key, private_key, addr: account };
    // User 1
    let (public_key, private_key, account) = ledger.new_allocated_account();
    let user_account = Account { public_key, private_key, addr: account };

    //. Package Publishing
    let package_address = ledger.compile_and_publish(this_package!());

    #[rustfmt::skip]
    let manifest = ManifestBuilder::new()
        .lock_fee_from_faucet()
        .call_function(
            package_address,
            "RedRoot", "instantiate",
            manifest_args!()
        )
        .call_method(
            main_account.addr,
            "deposit_batch",
            manifest_args!(ManifestExpression::EntireWorktop)
        )
        .build();
    let tx_instantiate_receipt = ledger.execute_manifest(manifest, vec![NonFungibleGlobalId::from_public_key(&main_account.public_key)]);

    // println!("{:?}\n", tx_instantiate_receipt);

    let component = tx_instantiate_receipt.expect_commit(true).new_component_addresses()[0];

    #[rustfmt::skip]
    let manifest = ManifestBuilder::new()
        .lock_fee_from_faucet()
        .call_method(component, "add_asset", manifest_args!());

    Ok(())
}
