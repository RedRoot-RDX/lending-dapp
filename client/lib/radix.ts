import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { RadixDappToolkit, RadixNetwork } from "@radixdlt/radix-dapp-toolkit";
import { definitionAddress } from "./utils";

console.log("[radix.ts] dApp definition address:", definitionAddress);

export const rdt = RadixDappToolkit({
  dAppDefinitionAddress: definitionAddress,
  networkId: RadixNetwork.Stokenet,
  applicationName: "Radish",
  applicationVersion: "1.0.0",
  // logger: Logger(1),
});
console.log("[radix.ts] rdt:", rdt);

// Wallet connect styling
rdt.buttonApi.setTheme("white-with-outline");
rdt.buttonApi.setMode("light");

export const gatewayApi = GatewayApiClient.initialize(rdt.gatewayApi.clientConfig);
