"use client";

import { useState, useEffect } from "react";
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt
} from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { 
  Flame, 
  PlusCircle, 
  TrendingUp, 
  Wallet, 
  Coins, 
  RefreshCw, 
  Search, 
  ArrowDownUp, 
  X, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ChevronRight
} from "lucide-react";

// Contract Addresses we deployed
const FACTORY_ADDRESS = "0x1FB4F3e6e7d57aE31F5495973CA9298af383d18C";
const ROUTER_ADDRESS = "0xFfa2Af532BF7225af501eA0420b28B2B7698c0b6";
const WETH_ADDRESS = "0xbed97c4c145313c1738921a1fc4CC49Fa3Ddf518";

// Basic ABIs for contract interactions
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
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Navigation state
  const [activeTab, setActiveTab] = useState<"home" | "launch" | "swap">("home");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Token creation form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000000"); // 1 Billion standard
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  // Swap form state
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapOutput, setSwapOutput] = useState("");

  // Fetch all tokens from factory
  const { data: rawTokens, refetch: refetchTokens, isLoading: isLoadingTokens } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllTokens",
  });

  const tokens = Array.isArray(rawTokens) ? rawTokens : [];

  // Write contract states
  const { writeContract, data: txHash } = useWriteContract();

  // Launch Token transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchTokens();
      // Reset form
      setName("");
      setSymbol("");
      setImageUrl("");
      setDescription("");
      alert("Token Berhasil diluncurkan! 🎉");
      setActiveTab("home");
    }
  }, [isConfirmed]);

  // Handle Launch Token Submit
  const handleLaunch = () => {
    if (!name || !symbol || !supply) return;
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "launchToken",
      args: [
        name,
        symbol,
        BigInt(supply),
        imageUrl || "https://placeholder.co/150",
        description || "No description provided."
      ]
    });
  };

  // Handle Swap / Trade
  const handleSwap = () => {
    if (!selectedToken || !swapAmount) return;
    const path = swapType === "buy" 
      ? [WETH_ADDRESS, selectedToken.tokenAddress]
      : [selectedToken.tokenAddress, WETH_ADDRESS];

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from now

    if (swapType === "buy") {
      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: "swapExactETHForTokens",
        args: [
          BigInt(0), // Min amount out (set to 0 for simplicity in testnet)
          path,
          address,
          deadline
        ],
        value: parseEther(swapAmount)
      });
    } else {
      // For selling, we would normally approve first, but for quick testnet MVP we proceed or remind
      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: "swapExactTokensForETH",
        args: [
          parseUnits(swapAmount, 18),
          BigInt(0),
          path,
          address,
          deadline
        ]
      });
    }
  };

  // Filtered tokens
  const filteredTokens = tokens.filter((t: any) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 pb-20 select-none">
      {/* HEADER */}
      <header className="px-5 py-4 flex justify-between items-center bg-cardBg border-b border-cardBorder">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-extrabold text-lg">F</span>
          <span className="text-xl font-bold tracking-tight text-white">Flaunch<span className="text-primary">TQ</span></span>
        </div>
        {isConnected ? (
          <button 
            onClick={() => disconnect()}
            className="px-3 py-1.5 rounded-full bg-cardBorder hover:bg-opacity-80 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Wallet size={12} className="text-primary" />
            {address?.slice(0, 5)}...{address?.slice(-4)}
          </button>
        ) : (
          <button 
            onClick={() => connect({ connector: injected() })}
            className="px-4 py-1.5 rounded-full bg-primary hover:bg-opacity-90 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Wallet size={12} />
            Connect Wallet
          </button>
        )}
      </header>

      {/* STATS STRIP (Top) */}
      <div className="px-5 py-3 flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-none border-b border-cardBorder">
        <div className="bg-cardBg rounded-xl px-4 py-2 border border-cardBorder min-w-[120px] flex-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold">Total Launched</div>
          <div className="text-lg font-bold text-white mt-0.5">{tokens.length} Coins</div>
        </div>
        <div className="bg-cardBg rounded-xl px-4 py-2 border border-cardBorder min-w-[120px] flex-1">
          <div className="text-[10px] text-gray-400 uppercase font-bold">Gas Fee</div>
          <div className="text-lg font-bold text-green-400 mt-0.5">8 wei 🔥</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-5 pt-4">
        
        {/* TAB 1: HOME (BROWSE TOKENS) */}
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari token, simbol, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-cardBg border border-cardBorder rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
              />
              <Search className="absolute left-3.5 top-3.5 text-gray-500" size={16} />
            </div>

            {/* Token List */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider pl-1">
                <Flame size={14} className="text-primary animate-pulse" />
                Trending Coins
              </div>

              {isLoadingTokens ? (
                <div className="flex justify-center items-center py-10">
                  <RefreshCw className="animate-spin text-primary" size={24} />
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  Belum ada token diluncurkan. Jadi yang pertama! 🚀
                </div>
              ) : (
                filteredTokens.map((token: any, i: number) => (
                  <div 
                    key={i} 
                    className="bg-cardBg border border-cardBorder rounded-2xl p-4 flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedToken(token);
                      setActiveTab("swap");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={token.imageUrl} 
                        alt={token.symbol} 
                        className="w-11 h-11 rounded-xl object-cover bg-neutral-800"
                        onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-sm">{token.symbol}</span>
                          <span className="text-[10px] bg-cardBorder text-gray-400 px-1.5 py-0.5 rounded-md font-semibold">TeqL2</span>
                        </div>
                        <div className="text-[11px] text-gray-400 line-clamp-1 max-w-[150px] mt-0.5">{token.name}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs bg-primary bg-opacity-15 text-primary border border-primary border-opacity-20 px-3 py-1.5 rounded-xl font-bold hover:bg-opacity-25 transition-all">
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
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-2">
              <PlusCircle className="text-primary" size={20} />
              Luncurkan Token Baru
            </h2>

            <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Nama Token</label>
                <input 
                  type="text" 
                  placeholder="Contoh: TeqDogecoin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Simbol Token</label>
                <input 
                  type="text" 
                  placeholder="Contoh: TDOGE"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Jumlah Supply</label>
                <input 
                  type="number" 
                  placeholder="Contoh: 1,000,000,000"
                  value={supply}
                  onChange={(e) => setSupply(e.target.value)}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">URL Gambar / Logo</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Deskripsi Token</label>
                <textarea 
                  placeholder="Tentang token ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full mt-1.5 bg-background border border-cardBorder rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button 
                onClick={handleLaunch}
                disabled={isConfirming || !isConnected}
                className="w-full bg-primary hover:bg-opacity-95 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm mt-2"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Sedang Meluncurkan...
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    Luncurkan Token (Gratis Gas L2)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SWAP/TRADE */}
        {activeTab === "swap" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-2">
              <ArrowDownUp className="text-primary" size={20} />
              Swap / Dagang Token
            </h2>

            {selectedToken ? (
              <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-4">
                {/* Active Token Info */}
                <div className="flex items-center gap-3 bg-background p-3 rounded-2xl border border-cardBorder">
                  <img 
                    src={selectedToken.imageUrl} 
                    alt={selectedToken.symbol} 
                    className="w-10 h-10 rounded-xl object-cover bg-neutral-800"
                    onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                  />
                  <div>
                    <div className="font-bold text-sm text-white">{selectedToken.name}</div>
                    <div className="text-xs text-primary font-bold">{selectedToken.symbol} ({selectedToken.tokenAddress.slice(0,6)}...{selectedToken.tokenAddress.slice(-4)})</div>
                  </div>
                </div>

                {/* Buy/Sell Toggles */}
                <div className="flex bg-background p-1.5 rounded-2xl border border-cardBorder">
                  <button 
                    onClick={() => { setSwapType("buy"); setSwapAmount(""); }}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${swapType === "buy" ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
                  >
                    Beli {selectedToken.symbol}
                  </button>
                  <button 
                    onClick={() => { setSwapType("sell"); setSwapAmount(""); }}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${swapType === "sell" ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"}`}
                  >
                    Jual {selectedToken.symbol}
                  </button>
                </div>

                {/* Inputs */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                      <span>MASUKKAN</span>
                      <span>Balance: -</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        className="w-full bg-background border border-cardBorder rounded-2xl py-3 px-4 pr-16 text-sm text-white font-bold focus:outline-none focus:border-primary"
                      />
                      <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">
                        {swapType === "buy" ? "ETH" : selectedToken.symbol}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-background border border-cardBorder flex items-center justify-center text-primary hover:text-white transition-all cursor-pointer">
                      <ArrowDownUp size={14} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                      <span>ESTIMASI DAPAT</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="0.00"
                        readOnly
                        value={swapAmount ? (parseFloat(swapAmount) * 125000).toLocaleString() : "0.00"} // Mock price path calculation for Testnet
                        className="w-full bg-background border border-cardBorder rounded-2xl py-3 px-4 pr-16 text-sm text-white font-bold focus:outline-none"
                      />
                      <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">
                        {swapType === "buy" ? selectedToken.symbol : "ETH"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <button 
                  onClick={handleSwap}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all mt-2 ${swapType === "buy" ? "bg-primary hover:bg-opacity-95 text-white" : "bg-red-500 hover:bg-opacity-95 text-white"}`}
                >
                  Confirm Swap 🚀
                </button>
              </div>
            ) : (
              <div className="bg-cardBg border border-cardBorder rounded-3xl p-8 text-center text-gray-500 text-sm">
                Pilih koin di halaman utama / Home dulu untuk melakukan swap trading! 📈
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR (Mobile Style) */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-cardBg border-t border-cardBorder py-3 px-6 flex justify-around items-center z-50 shadow-lg">
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "home" ? "text-primary scale-110" : "text-gray-500 hover:text-white"}`}
        >
          <Flame size={20} />
          <span className="text-[10px] font-extrabold tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab("launch")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "launch" ? "text-primary scale-110" : "text-gray-500 hover:text-white"}`}
        >
          <PlusCircle size={20} />
          <span className="text-[10px] font-extrabold tracking-wider">Launch</span>
        </button>

        <button 
          onClick={() => setActiveTab("swap")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "swap" ? "text-primary scale-110" : "text-gray-500 hover:text-white"}`}
        >
          <ArrowDownUp size={20} />
          <span className="text-[10px] font-extrabold tracking-wider">Swap</span>
        </button>
      </nav>
    </div>
  );
}
