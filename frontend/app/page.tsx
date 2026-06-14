"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, http, custom, parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { 
  Flame, 
  PlusCircle, 
  Wallet, 
  RefreshCw, 
  Search, 
  ArrowDownUp, 
  X, 
  CheckCircle,
  TrendingUp,
  ExternalLink,
  Lock,
  Coins,
  ChevronRight,
  TrendingDown
} from "lucide-react";

// Deployed Smart Contract Addresses on TeQoin Testnet
const FACTORY_ADDRESS = "0x1FB4F3e6e7d57aE31F5495973CA9298af383d18C";
const ROUTER_ADDRESS = "0xFfa2Af532BF7225af501eA0420b28B2B7698c0b6";
const WETH_ADDRESS = "0xbed97c4c145313c1738921a1fc4CC49Fa3Ddf518";

// Custom Chain definition
const teqoinTestnet = {
  id: 420377,
  name: "TeQoin Testnet",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-testnet.teqoin.io"] } },
};

// Viem Public Client for Real-time Reading
const publicClient = createPublicClient({
  chain: teqoinTestnet,
  transport: http(),
});

// ABIs
const FACTORY_ABI = [
  {
    name: "getAllTokens",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "imageUrl", type: "string" },
          { name: "description", type: "string" },
          { name: "createdAt", type: "uint256" }
        ],
        type: "tuple[]"
      }
    ]
  },
  {
    name: "launchToken",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_totalSupply", type: "uint256" },
      { name: "_imageUrl", type: "string" },
      { name: "_description", type: "string" }
    ],
    outputs: [{ type: "address" }]
  }
];

const ROUTER_ABI = [
  {
    name: "swapExactETHForTokens",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    outputs: [{ type: "uint256[]" }]
  },
  {
    name: "swapExactTokensForETH",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    outputs: [{ type: "uint256[]" }]
  },
  {
    name: "getAmountsOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" }
    ],
    outputs: [{ type: "uint256[]" }]
  }
];

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  }
];

export default function Home() {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];

  // Navigation & States
  const [activeTab, setActiveTab] = useState<"home" | "launch" | "swap">("home");
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State - Launch
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000000"); // 1 Billion
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  // Form State - Swap
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapOutput, setSwapOutput] = useState("0.00");
  const [isSwapping, setIsSwapping] = useState(false);
  const [userTokenBalance, setUserUserTokenBalance] = useState("0.00");
  const [userEthBalance, setUserEthBalance] = useState("0.00");

  // Fetch Real Token List from Contract
  const fetchTokens = async () => {
    try {
      setIsLoadingTokens(true);
      const data: any = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getAllTokens",
      });
      if (Array.isArray(data)) {
        setTokens(data);
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  // Fetch Live Swap Quote
  useEffect(() => {
    const fetchQuote = async () => {
      if (!selectedToken || !swapAmount || parseFloat(swapAmount) <= 0) {
        setSwapOutput("0.00");
        return;
      }
      try {
        const amountIn = swapType === "buy" 
          ? parseEther(swapAmount)
          : parseUnits(swapAmount, 18);

        const path = swapType === "buy"
          ? [WETH_ADDRESS, selectedToken.tokenAddress]
          : [selectedToken.tokenAddress, WETH_ADDRESS];

        const amounts: any = await publicClient.readContract({
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountIn, path],
        });

        if (Array.isArray(amounts) && amounts.length > 1) {
          const out = swapType === "buy"
            ? formatUnits(amounts[1], 18)
            : formatEther(amounts[1]);
          setSwapOutput(parseFloat(out).toLocaleString("en-US", { maximumFractionDigits: 6 }));
        }
      } catch (err) {
        setSwapOutput("0.00 (No Liquidity)");
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [swapAmount, swapType, selectedToken]);

  // Fetch Wallet Balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!authenticated || !activeWallet || !selectedToken) return;
      try {
        const ethBal = await publicClient.getBalance({ address: activeWallet.address as `0x${string}` });
        setUserEthBalance(formatEther(ethBal));

        const tokenBal: any = await publicClient.readContract({
          address: selectedToken.tokenAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [activeWallet.address],
        });
        setUserUserTokenBalance(formatUnits(tokenBal, 18));
      } catch (err) {
        console.error("Error fetching balances:", err);
      }
    };
    fetchBalances();
  }, [authenticated, activeWallet, selectedToken, activeTab, isSwapping]);

  // Action: Launch Token
  const handleLaunch = async () => {
    if (!name || !symbol || !supply || !activeWallet) return;
    try {
      setIsLaunching(true);
      await activeWallet.switchChain(teqoinTestnet.id);

      const provider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: activeWallet.address as `0x${string}`,
        chain: teqoinTestnet,
        transport: custom(provider),
      });

      const { request } = await publicClient.simulateContract({
        account: activeWallet.address as `0x${string}`,
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "launchToken",
        args: [
          name,
          symbol,
          BigInt(supply),
          imageUrl || "https://placeholder.co/150",
          description || "A custom community token launched on TeQoin L2."
        ],
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      alert("Token launched successfully! 🎉");
      setName("");
      setSymbol("");
      setImageUrl("");
      setDescription("");
      fetchTokens();
      setActiveTab("home");
    } catch (err: any) {
      console.error(err);
      alert("Deployment failed: " + err.message);
    } finally {
      setIsLaunching(false);
    }
  };

  // Action: Swap / Trade
  const handleSwap = async () => {
    if (!selectedToken || !swapAmount || !activeWallet) return;
    try {
      setIsSwapping(true);
      await activeWallet.switchChain(teqoinTestnet.id);

      const provider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: activeWallet.address as `0x${string}`,
        chain: teqoinTestnet,
        transport: custom(provider),
      });

      const path = swapType === "buy" 
        ? [WETH_ADDRESS, selectedToken.tokenAddress]
        : [selectedToken.tokenAddress, WETH_ADDRESS];

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20m

      if (swapType === "buy") {
        const { request } = await publicClient.simulateContract({
          account: activeWallet.address as `0x${string}`,
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: "swapExactETHForTokens",
          args: [BigInt(0), path, activeWallet.address, deadline],
          value: parseEther(swapAmount),
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        alert("Swap completed successfully! 🚀");
      } else {
        const amountIn = parseUnits(swapAmount, 18);
        const { request: approveRequest } = await publicClient.simulateContract({
          account: activeWallet.address as `0x${string}`,
          address: selectedToken.tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ROUTER_ADDRESS, amountIn],
        });
        const approveHash = await walletClient.writeContract(approveRequest);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        const { request: swapRequest } = await publicClient.simulateContract({
          account: activeWallet.address as `0x${string}`,
          address: ROUTER_ADDRESS,
          abi: ROUTER_ABI,
          functionName: "swapExactTokensForETH",
          args: [amountIn, BigInt(0), path, activeWallet.address, deadline],
        });
        const swapHash = await walletClient.writeContract(swapRequest);
        await publicClient.waitForTransactionReceipt({ hash: swapHash });
        alert("Tokens sold successfully! 🚀");
      }

      setSwapAmount("");
    } catch (err: any) {
      console.error(err);
      alert("Swap failed: " + err.message);
    } finally {
      setIsSwapping(false);
    }
  };

  // Search Filter
  const filteredTokens = tokens.filter((t: any) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 pb-24 select-none relative">
      {/* GLOW DECORATIONS (Premium Aesthetic) */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* HEADER (Frosted Glassmorphism) */}
      <header className="px-5 py-4 flex justify-between items-center bg-cardBg/80 backdrop-blur-md border-b border-cardBorder sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">F</span>
          <span className="text-xl font-black tracking-tight text-white">Flaunch<span className="text-primary">TQ</span></span>
        </div>
        {!ready ? (
          <div className="w-24 h-9 bg-cardBorder animate-pulse rounded-full" />
        ) : authenticated ? (
          <button 
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl bg-cardBorder hover:bg-opacity-80 text-white font-bold text-xs flex items-center gap-2 transition-all border border-cardBorder shadow-sm"
          >
            <Wallet size={14} className="text-primary" />
            {activeWallet?.address ? `${activeWallet.address.slice(0, 5)}...${activeWallet.address.slice(-4)}` : "Profile"}
          </button>
        ) : (
          <button 
            onClick={() => login()}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-opacity-90 active:scale-[0.97] text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/25"
          >
            <Wallet size={14} />
            Connect
          </button>
        )}
      </header>

      {/* STATS STRIP */}
      <div className="px-5 py-3 flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-none border-b border-cardBorder bg-background relative z-10">
        <div className="bg-cardBg rounded-2xl px-4 py-2.5 border border-cardBorder min-w-[130px] flex-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Coins</div>
          <div className="text-lg font-black text-white mt-0.5">{tokens.length} Deployed</div>
        </div>
        <div className="bg-cardBg rounded-2xl px-4 py-2.5 border border-cardBorder min-w-[130px] flex-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">TeQoin Gas</div>
          <div className="text-lg font-black text-primary mt-0.5">8 wei 🔥</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-5 pt-5 relative z-10">
        
        {/* TAB 1: HOME (BROWSE TOKENS) */}
        {activeTab === "home" && (
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search tokens, symbols, addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-cardBg border border-cardBorder rounded-2xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <Search className="absolute left-3.5 top-4 text-gray-500" size={16} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-extrabold uppercase tracking-wider pl-1">
                <Flame size={14} className="text-primary animate-pulse" />
                Live Coins on TeQoin
              </div>

              {isLoadingTokens ? (
                <div className="flex justify-center items-center py-16">
                  <RefreshCw className="animate-spin text-primary" size={24} />
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-sm bg-cardBg rounded-2xl border border-cardBorder p-6">
                  No tokens deployed yet. Be the first to launch! 🚀
                </div>
              ) : (
                filteredTokens.map((token: any, i: number) => (
                  <div 
                    key={i} 
                    className="bg-cardBg border border-cardBorder rounded-2xl p-4 flex items-center justify-between hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer shadow-md"
                    onClick={() => {
                      setSelectedToken(token);
                      setActiveTab("swap");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={token.imageUrl} 
                        alt={token.symbol} 
                        className="w-12 h-12 rounded-xl object-cover bg-neutral-800 border border-cardBorder"
                        onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-sm">{token.symbol}</span>
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-black">L2</span>
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-1 max-w-[150px] mt-0.5">{token.name}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-4 py-2 rounded-xl font-extrabold hover:bg-opacity-20 active:scale-95 transition-all">
                        Trade
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LAUNCH TOKEN FORM */}
        {activeTab === "launch" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2">
              <PlusCircle className="text-primary" size={20} />
              Launch New Coin
            </h2>

            <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-4 shadow-xl">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Token Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. TeQoin Shiba"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Token Symbol</label>
                <input 
                  type="text" 
                  placeholder="e.g. TSHIB"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Total Supply</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000000000"
                  value={supply}
                  onChange={(e) => setSupply(e.target.value)}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Logo URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                <textarea 
                  placeholder="Tell us about this token..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <button 
                onClick={handleLaunch}
                disabled={isLaunching || !authenticated}
                className="w-full bg-primary hover:bg-opacity-95 active:scale-[0.98] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm mt-2 shadow-lg shadow-primary/25"
              >
                {isLaunching ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Launching...
                  </>
                ) : !authenticated ? (
                  <>
                    <Lock size={15} />
                    Login Required to Launch
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    Launch Token (8 Wei Gas)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SWAP/TRADE */}
        {activeTab === "swap" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2">
              <ArrowDownUp className="text-primary" size={20} />
              Trade Tokens
            </h2>

            {selectedToken ? (
              <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-4 shadow-xl">
                {/* Token Header */}
                <div className="flex items-center gap-3 bg-background p-3 rounded-2xl border border-cardBorder">
                  <img 
                    src={selectedToken.imageUrl} 
                    alt={selectedToken.symbol} 
                    className="w-11 h-11 rounded-xl object-cover bg-neutral-800 border border-cardBorder"
                    onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                  />
                  <div>
                    <div className="font-extrabold text-sm text-white">{selectedToken.name}</div>
                    <div className="text-xs text-primary font-bold">{selectedToken.symbol}</div>
                  </div>
                </div>

                {/* Buy/Sell Toggles */}
                <div className="flex bg-background p-1.5 rounded-2xl border border-cardBorder">
                  <button 
                    onClick={() => { setSwapType("buy"); setSwapAmount(""); }}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${swapType === "buy" ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white"}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => { setSwapType("sell"); setSwapAmount(""); }}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${swapType === "sell" ? "bg-red-500 text-white shadow" : "text-gray-400 hover:text-white"}`}
                  >
                    Sell
                  </button>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5 px-1">
                      <span>SEND</span>
                      <span>Balance: {swapType === "buy" ? parseFloat(userEthBalance).toFixed(4) : parseFloat(userTokenBalance).toFixed(4)}</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        className="w-full bg-background border border-cardBorder rounded-2xl py-3.5 px-4 pr-16 text-sm text-white font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-400">
                        {swapType === "buy" ? "ETH" : selectedToken.symbol}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-background border border-cardBorder flex items-center justify-center text-primary hover:text-white transition-all">
                      <ArrowDownUp size={14} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5 px-1">
                      <span>RECEIVE (Live Quote)</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="0.00"
                        readOnly
                        value={swapOutput}
                        className="w-full bg-background border border-cardBorder rounded-2xl py-3.5 px-4 pr-16 text-sm text-white font-bold focus:outline-none"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-400">
                        {swapType === "buy" ? selectedToken.symbol : "ETH"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button 
                  onClick={handleSwap}
                  disabled={isSwapping || !authenticated || !swapAmount}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mt-2 active:scale-[0.98] disabled:opacity-50 shadow-lg ${swapType === "buy" ? "bg-primary text-white shadow-primary/25" : "bg-red-500 text-white shadow-red-500/25"}`}
                >
                  {isSwapping ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <RefreshCw className="animate-spin" size={14} />
                      Processing Swap...
                    </span>
                  ) : !authenticated ? (
                    "Login to Trade"
                  ) : (
                    "Confirm Swap 🚀"
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-cardBg border border-cardBorder rounded-3xl p-8 text-center text-gray-500 text-sm">
                Select a coin from the Home list first to trade! 📈
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR (Fully Polished, iOS Safe-Area Compatible) */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-cardBg border-t border-cardBorder pt-3 pb-[env(safe-area-inset-bottom,16px)] px-6 flex justify-around items-center z-50 shadow-2xl backdrop-blur-md bg-opacity-95">
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${activeTab === "home" ? "bg-primary/10 text-primary scale-105 font-bold" : "text-gray-400 hover:text-white"}`}
        >
          <Flame size={20} fill={activeTab === "home" ? "currentColor" : "none"} />
          <span className="text-[10px] font-extrabold tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab("launch")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${activeTab === "launch" ? "bg-primary/10 text-primary scale-105 font-bold" : "text-gray-400 hover:text-white"}`}
        >
          <PlusCircle size={20} fill={activeTab === "launch" ? "currentColor" : "none"} />
          <span className="text-[10px] font-extrabold tracking-wider">Launch</span>
        </button>

        <button 
          onClick={() => setActiveTab("swap")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${activeTab === "swap" ? "bg-primary/10 text-primary scale-105 font-bold" : "text-gray-400 hover:text-white"}`}
        >
          <ArrowDownUp size={20} />
          <span className="text-[10px] font-extrabold tracking-wider">Swap</span>
        </button>
      </nav>
    </div>
  );
}
