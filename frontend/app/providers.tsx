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
  // We use a demo Privy App ID. The user can easily replace this in production settings.
  const PRIVY_APP_ID = "clvyv8z9r00j812n6c2u9b3e1"; 

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#FF2D78",
          logo: "https://docs.teqoin.io/introduction/what-is-teqoin",
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
