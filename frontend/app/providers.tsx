"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { type Chain } from "viem";

// Define custom TeQoin Testnet chain for Privy
export const teqoinTestnet: Chain = {
  id: 420377,
  name: "TeQoin Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.teqoin.io"] },
  },
  blockExplorers: {
    default: { name: "TeQoin Scan", url: "https://testnet-blockscan.teqoin.io" },
  },
  testnet: true,
};

export function Providers({ children }: { children: React.ReactNode }) {
  // Configured with your custom Privy App ID
  const PRIVY_APP_ID = "cmqdk2v9000mv0dl45vty4gj9"; 

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#FF2D78",
          logo: "https://mintlify.s3.us-west-1.amazonaws.com/teqoin/logo/TeQoin.svg",
        },
        loginMethods: ["email", "google", "twitter", "wallet"],
        defaultChain: teqoinTestnet,
        supportedChains: [teqoinTestnet],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
