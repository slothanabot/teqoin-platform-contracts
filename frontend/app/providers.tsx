"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider } from "wagmi";
import { type Chain } from "viem";
import { injected } from "wagmi/connectors";

// Define custom TeQoin Testnet chain
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

const config = createConfig({
  chains: [teqoinTestnet],
  connectors: [injected()],
  transports: {
    [teqoinTestnet.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
