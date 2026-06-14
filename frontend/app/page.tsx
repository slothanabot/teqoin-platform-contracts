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
  ArrowLeft,
  X, 
  CheckCircle,
  Plus,
  Home as HomeIcon,
  Sparkles,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Coins,
  Lock,
  ChevronRight
} from "lucide-react";

// Deployed Smart Contract Addresses on TeQoin Testnet
const FACTORY_ADDRESS = "0x1FB4F3e6e7d57aE31F5495973CA9298af383d18C";
const ROUTER_ADDRESS = "0xFfa2Af532BF7225af501eA0420b28B2B7698c0b6";
const WETH_ADDRESS = "0xbed97c4c145313c1738921a1fc4CC49Fa3Ddf518";

const teqoinTestnet = {
  id: 420377,
  name: "TeQoin Testnet",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-testnet.teqoin.io"] } },
};

const publicClient = createPublicClient({
  chain: teqoinTestnet,
  transport: http(),
});

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

  // Navigation: "home" | "launch" | "details"
  const [currentView, setCurrentView] = useState<"home" | "launch" | "details">("home");
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"trending" | "new" | "top" | "highvol">("trending");

  // Form State - Launch
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000000"); // 1 Billion
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  // Social & Share Earnings States
  const [socialLinksExpanded, setSocialLinksExpanded] = useState(false);
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [farcaster, setFarcaster] = useState("");

  const [showShareEarnings, setShowShareEarnings] = useState(false);
  const [earningsReceivers, setEarningsReceivers] = useState<any[]>([
    { address: "@theovertheraa", percent: 100, type: "twitter" }
  ]);
  const [newReceiverAddress, setNewReceiverAddress] = useState("");
  const [newReceiverPercent, setNewReceiverPercent] = useState("10");
  const [newReceiverType, setNewReceiverType] = useState<"wallet" | "email" | "twitter" | "farcaster">("wallet");
  const [showAddMember, setShowAddMember] = useState(false);

  // Form State - Swap
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapOutput, setSwapOutput] = useState("0.00");
  const [isSwapping, setIsSwapping] = useState(false);
  const [userTokenBalance, setUserUserTokenBalance] = useState("0.00");
  const [userEthBalance, setUserEthBalance] = useState("0.00");

  // Selected Token Metadata Persistence State (Splits & Socials)
  const [currentTokenMetadata, setCurrentTokenMetadata] = useState<any>(null);

  useEffect(() => {
    if (selectedToken) {
      const saved = localStorage.getItem(`token_metadata_${selectedToken.tokenAddress.toLowerCase()}`);
      if (saved) {
        setCurrentTokenMetadata(JSON.parse(saved));
      } else {
        setCurrentTokenMetadata({
          splits: [{ address: selectedToken.creator, percent: 100, type: "wallet" }],
          socials: { website: "", twitter: "", telegram: "", discord: "", farcaster: "" }
        });
      }
    }
  }, [selectedToken, currentView]);
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
  }, [authenticated, activeWallet, selectedToken, currentView, isSwapping]);

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
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Fetch all tokens to find our deployed token's address
      const updatedTokens: any = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getAllTokens",
      });

      if (Array.isArray(updatedTokens) && updatedTokens.length > 0) {
        const latestToken = updatedTokens[updatedTokens.length - 1];
        const latestAddress = latestToken.tokenAddress;

        // Persist splits and social links to localStorage under the address key
        const tokenMetadata = {
          splits: earningsReceivers,
          socials: { website, twitter, telegram, discord, farcaster }
        };
        localStorage.setItem(`token_metadata_${latestAddress.toLowerCase()}`, JSON.stringify(tokenMetadata));
      }

      alert("Token launched successfully! 🎉");
      setName("");
      setSymbol("");
      setImageUrl("");
      setDescription("");
      setWebsite("");
      setTwitter("");
      setTelegram("");
      setDiscord("");
      setFarcaster("");
      setEarningsReceivers([{ address: "@theovertheraa", percent: 100, type: "twitter" }]);
      fetchTokens();
      setCurrentView("home");
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
    <div className="flex flex-col flex-1 pb-24 select-none relative bg-background min-h-screen">
      {/* 1. INFINITE SCROLLING TICKER (Marquee) */}
      <div className="w-full bg-[#12121A] border-b border-cardBorder py-2 overflow-hidden relative z-50">
        <div className="animate-marquee whitespace-nowrap flex gap-8 text-[11px] font-bold text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> TMLNCH <span className="text-primary font-extrabold">Launched</span></span>
          <span>DRB <span className="text-red-500">Sell $8.26</span></span>
          <span>ODAI <span className="text-green-400">Big Buy $1681.17</span></span>
          <span>CABURO <span className="text-primary">Launched</span></span>
          <span>FXLK <span className="text-green-400">Buy $120.44</span></span>
          <span>TAKEOVER <span className="text-red-500">Sell $45.10</span></span>
          {/* Duplicate for seamless scrolling */}
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> TMLNCH <span className="text-primary font-extrabold">Launched</span></span>
          <span>DRB <span className="text-red-500">Sell $8.26</span></span>
          <span>ODAI <span className="text-green-400">Big Buy $1681.17</span></span>
          <span>CABURO <span className="text-primary">Launched</span></span>
          <span>FXLK <span className="text-green-400">Buy $120.44</span></span>
          <span>TAKEOVER <span className="text-red-500">Sell $45.10</span></span>
        </div>
      </div>

      {/* GLOW DECORATIONS */}
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-5 pt-4 relative z-10">
        
        {/* VIEW 1: HOME (BROWSE TOKENS) */}
        {currentView === "home" && (
          <div className="space-y-4">
            
            {/* 2. PIXEL-PERFECT FLAUNCH HERO CARDS */}
            <div className="space-y-3">
              {/* Card 1: Total Creator Earnings */}
              <div className="bg-cardBg border border-cardBorder rounded-[24px] p-5 flex justify-between items-center relative overflow-hidden shadow-lg">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total creator earnings</div>
                  <div className="text-2xl font-black text-white leading-tight">$2,676,858</div>
                </div>
                {/* Right Badge (Capsule) */}
                <div className="flex items-center gap-2 bg-[#1B1B26] border border-cardBorder py-1.5 px-3 rounded-full text-[10px] text-gray-300 font-extrabold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  0x37E2...0e1C
                  <span className="text-[9px] text-[#A78BFA] bg-[#2E284C] px-1.5 py-0.5 rounded font-bold">Claimed $16.09</span>
                </div>
              </div>

              {/* Card 2: 24hr Volume */}
              <div className="bg-cardBg border border-cardBorder rounded-[24px] p-5 flex justify-between items-center relative overflow-hidden shadow-lg">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">24hr volume</div>
                  <div className="text-2xl font-black text-white leading-tight">$45,059</div>
                </div>
                {/* Right Badge (Capsule) */}
                <div className="flex items-center gap-2 bg-[#1B1B26] border border-cardBorder py-1.5 px-3 rounded-full text-[10px] text-gray-300 font-extrabold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  TAKEOVER
                  <span className="text-[9px] text-[#34D399] bg-[#1E3A2F] px-1.5 py-0.5 rounded font-bold">BIG BUY $1506.34</span>
                </div>
              </div>
            </div>

            {/* 3. CATEGORY PILL TABS */}
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
              <button 
                onClick={() => setActiveFilter("trending")}
                className={`flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-black transition-all shadow-sm ${activeFilter === "trending" ? "bg-primary text-white" : "bg-cardBg border border-cardBorder text-gray-400 hover:text-white"}`}
              >
                <Flame size={13} fill={activeFilter === "trending" ? "currentColor" : "none"} />
                Trending
              </button>
              
              <button 
                onClick={() => setActiveFilter("new")}
                className={`flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-black transition-all shadow-sm ${activeFilter === "new" ? "bg-[#8B5CF6] text-white" : "bg-cardBg border border-cardBorder text-gray-400 hover:text-white"}`}
              >
                <Sparkles size={13} />
                New
              </button>

              <button 
                onClick={() => setActiveFilter("top")}
                className={`flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-black transition-all shadow-sm ${activeFilter === "top" ? "bg-[#10B981] text-white" : "bg-cardBg border border-cardBorder text-gray-400 hover:text-white"}`}
              >
                <BarChart2 size={13} />
                Top
              </button>

              <button 
                onClick={() => setActiveFilter("highvol")}
                className={`flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-black transition-all shadow-sm ${activeFilter === "highvol" ? "bg-[#3B82F6] text-white" : "bg-cardBg border border-cardBorder text-gray-400 hover:text-white"}`}
              >
                <ArrowDownUp size={13} />
                High vol
              </button>
            </div>


            {/* 4. PREMIUM COMPACT TOKEN ROW LAYOUT (WITH SPARKLINE) */}
            <div className="space-y-2.5">
              {isLoadingTokens ? (
                <div className="flex justify-center items-center py-16">
                  <RefreshCw className="animate-spin text-primary" size={24} />
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-sm bg-cardBg rounded-2xl border border-cardBorder p-6 shadow-md">
                  No tokens deployed yet. Be the first to launch! 🚀
                </div>
              ) : (
                filteredTokens.map((token: any, i: number) => {
                  const isUp = i % 2 === 0; // Alternating for dynamic testnet look
                  return (
                    <div 
                      key={i} 
                      className="bg-cardBg/60 border border-cardBorder/80 rounded-2xl p-4 flex items-center justify-between hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer shadow-md"
                      onClick={() => {
                        setSelectedToken(token);
                        setSwapAmount("");
                        setSwapOutput("0.00");
                        setCurrentView("details");
                      }}
                    >
                      {/* Left: Avatar + Name/Symbol */}
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.imageUrl} 
                          alt={token.symbol} 
                          className="w-11 h-11 rounded-full object-cover bg-neutral-800 border border-cardBorder/60"
                          onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                        />
                        <div>
                          <div className="font-extrabold text-white text-[14px] leading-tight">{token.name}</div>
                          <div className="text-[11px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">{token.symbol}</div>
                        </div>
                      </div>

                      {/* Center: Premium SVG Sparkline */}
                      <div className="w-20 h-8 flex items-center">
                        <svg className="w-full h-full" viewBox="0 0 100 30">
                          <path 
                            d={isUp 
                              ? "M0,25 Q15,5 30,20 T60,8 T90,15 L100,5" 
                              : "M0,5 Q15,25 30,12 T60,25 T90,15 L100,28"
                            } 
                            fill="none" 
                            stroke={isUp ? "#10B981" : "#EF4444"} 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Right: Market Cap & Price Move */}
                      <div className="text-right">
                        <div className="font-black text-white text-sm">$971.4K</div>
                        <div className={`text-[10px] font-black flex items-center justify-end gap-0.5 mt-0.5 ${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isUp ? "+1.8%" : "-1.2%"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: LAUNCH TOKEN FORM */}
        {/* VIEW 2: LAUNCH TOKEN FORM (Flaunch.gg Create Replica) */}
        {currentView === "launch" && (
          <div className="space-y-4 pb-12">
            <button 
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all pl-1 mb-2"
            >
              <ArrowLeft size={14} />
              Back to Browse
            </button>

            {/* 1. Earnings Banner */}
            <div className="bg-[#151522] border border-[#2E284C] rounded-2xl p-4 flex items-center gap-3 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-[#2D224C] flex items-center justify-center text-[#A78BFA]">
                <Coins size={18} />
              </div>
              <div className="text-xs font-bold text-gray-200">Trading this coin will generate earnings</div>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-4 pt-1">
              
              {/* 2. Dashed Upload Box */}
              <div className="flex justify-center py-3">
                <div 
                  onClick={() => {
                    const url = prompt("Enter Image URL for your Token logo:");
                    if (url) setImageUrl(url);
                  }}
                  className="w-32 h-32 rounded-3xl border-2 border-dashed border-cardBorder bg-cardBg hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Token preview" className="w-full h-full rounded-3xl object-cover" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-gray-400 group-hover:text-white transition-all">
                        <PlusCircle size={20} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-all">Upload</span>
                    </>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-cardBg border border-cardBorder rounded-2xl py-3.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Ticker */}
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="Ticker"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-cardBg border border-cardBorder rounded-2xl py-3.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <textarea 
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-cardBg border border-cardBorder rounded-2xl py-3.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              {/* 3. Share the Earnings Row */}
              <div 
                onClick={() => setShowShareEarnings(true)}
                className="bg-cardBg border border-cardBorder hover:border-primary/40 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-[#A78BFA]">
                    <Coins size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Share the earnings</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{earningsReceivers.length} receiver{earningsReceivers.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </div>

              {/* 4. Collapsible Social Links Accordion */}
              <div className="border border-cardBorder rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setSocialLinksExpanded(!socialLinksExpanded)}
                  className="w-full bg-cardBg px-4 py-3.5 flex justify-between items-center text-xs font-extrabold text-gray-300 hover:text-white transition-all"
                >
                  <span>Social links (optional)</span>
                  <ChevronRight size={14} className={`transform transition-transform ${socialLinksExpanded ? "rotate-90" : ""}`} />
                </button>
                {socialLinksExpanded && (
                  <div className="bg-[#12121A]/40 p-4 border-t border-cardBorder space-y-3">
                    <div>
                      <input 
                        type="text" 
                        placeholder="https://yoursite.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-cardBg border border-cardBorder rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        placeholder="x.com/handle"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        className="w-full bg-cardBg border border-cardBorder rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        placeholder="t.me/group"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        className="w-full bg-cardBg border border-cardBorder rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        placeholder="discord.gg/invite"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        className="w-full bg-cardBg border border-cardBorder rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        placeholder="farcaster.xyz/username"
                        value={farcaster}
                        onChange={(e) => setFarcaster(e.target.value)}
                        className="w-full bg-cardBg border border-cardBorder rounded-xl py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Action */}
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
                    Launch
                  </>
                )}
              </button>
            </div>

            {/* 5. INTERACTIVE SHARE EARNINGS BOTTOM SHEET */}
            {showShareEarnings && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
                <div className="w-full max-w-md bg-[#0F0F16] border-t border-cardBorder rounded-t-[32px] p-5 space-y-4 shadow-2xl relative animate-slide-up pb-[env(safe-area-inset-bottom,24px)]">
                  {/* Drag Indicator handle */}
                  <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-1"></div>
                  
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="text-sm font-black text-white">Share Earnings</h3>
                    <button 
                      onClick={() => { setShowShareEarnings(false); setShowAddMember(false); }}
                      className="p-1 rounded-full bg-cardBorder hover:bg-neutral-800 text-gray-400"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Active Receivers List */}
                  <div className="space-y-3">
                    {earningsReceivers.map((rec: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-cardBg border border-cardBorder p-3.5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <img 
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" 
                            alt="avatar" 
                            className="w-9 h-9 rounded-full object-cover border border-cardBorder"
                          />
                          <div>
                            <div className="text-xs font-black text-white">{rec.address}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{rec.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-primary">{rec.percent}%</span>
                          {earningsReceivers.length > 1 && (
                            <button 
                              onClick={() => {
                                const list = [...earningsReceivers];
                                list.splice(idx, 1);
                                setEarningsReceivers(list);
                              }}
                              className="text-red-500 text-xs font-bold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Member Form (Inline Bottom Sheet) */}
                  {showAddMember ? (
                    <div className="bg-[#151522] border border-cardBorder rounded-2xl p-4 space-y-4">
                      <div className="text-xs font-black text-white">Add member</div>
                      
                      {/* Social/Chain Tabs */}
                      <div className="flex gap-1 bg-background p-1 rounded-xl border border-cardBorder text-[10px] font-black text-gray-400">
                        <button 
                          onClick={() => setNewReceiverType("wallet")}
                          className={`flex-1 py-1.5 rounded-lg ${newReceiverType === "wallet" ? "bg-cardBorder text-white" : ""}`}
                        >
                          CA
                        </button>
                        <button 
                          onClick={() => setNewReceiverType("email")}
                          className={`flex-1 py-1.5 rounded-lg ${newReceiverType === "email" ? "bg-cardBorder text-white" : ""}`}
                        >
                          📧
                        </button>
                        <button 
                          onClick={() => setNewReceiverType("twitter")}
                          className={`flex-1 py-1.5 rounded-lg ${newReceiverType === "twitter" ? "bg-cardBorder text-white" : ""}`}
                        >
                          𝕏
                        </button>
                        <button 
                          onClick={() => setNewReceiverType("farcaster")}
                          className={`flex-1 py-1.5 rounded-lg ${newReceiverType === "farcaster" ? "bg-cardBorder text-white" : ""}`}
                        >
                          ⚿
                        </button>
                      </div>

                      {/* Input handle */}
                      <input 
                        type="text" 
                        placeholder={
                          newReceiverType === "wallet" ? "Wallet address or ENS name" :
                          newReceiverType === "email" ? "Email address" :
                          newReceiverType === "twitter" ? "Twitter/X handle" : "Farcaster username"
                        }
                        value={newReceiverAddress}
                        onChange={(e) => setNewReceiverAddress(e.target.value)}
                        className="w-full bg-background border border-cardBorder rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none"
                      />

                      {/* Percent Select Panel */}
                      <div className="bg-background border border-cardBorder rounded-xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs font-black text-gray-400">
                          <span>SPLIT PERCENT</span>
                          <span className="text-primary font-black">{newReceiverPercent}%</span>
                        </div>
                        <div className="flex justify-between gap-1 pt-1">
                          {["1", "10", "25", "50", "100"].map((pct) => (
                            <button 
                              key={pct}
                              onClick={() => setNewReceiverPercent(pct)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all ${newReceiverPercent === pct ? "bg-primary border-primary text-white" : "bg-cardBg border-cardBorder text-gray-400"}`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (!newReceiverAddress) return;
                            
                            // Adjust other splits to accommodate new member
                            const newPct = parseInt(newReceiverPercent);
                            const remaining = 100 - newPct;
                            const count = earningsReceivers.length;
                            
                            const updated = earningsReceivers.map(r => ({
                              ...r,
                              percent: Math.floor((r.percent / 100) * remaining)
                            }));

                            setEarningsReceivers([
                              ...updated,
                              { address: newReceiverAddress, percent: newPct, type: newReceiverType }
                            ]);

                            setNewReceiverAddress("");
                            setShowAddMember(false);
                          }}
                          className="flex-1 bg-white hover:bg-neutral-200 text-black py-2.5 rounded-xl text-xs font-black"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => setShowAddMember(false)}
                          className="flex-1 bg-cardBorder text-white py-2.5 rounded-xl text-xs font-black"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button 
                        onClick={() => setShowAddMember(true)}
                        className="w-full bg-[#1B1B26] hover:bg-opacity-80 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all border border-cardBorder shadow-sm"
                      >
                        <Plus size={14} />
                        Add another member
                      </button>
                      
                      <button 
                        onClick={() => setShowShareEarnings(false)}
                        className="w-full bg-primary hover:bg-opacity-95 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-primary/10 mt-1"
                      >
                        Confirm splits
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: TOKEN DETAILS & TRADE VIEW */}
        {currentView === "details" && selectedToken && (
          <div className="space-y-4">
            <button 
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all pl-1 mb-2"
            >
              <ArrowLeft size={14} />
              Back to Browse
            </button>

            {/* Token Profile Section */}
            <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-4">
                <img 
                  src={selectedToken.imageUrl} 
                  alt={selectedToken.symbol} 
                  className="w-16 h-16 rounded-2xl object-cover bg-neutral-800 border border-cardBorder shadow-sm"
                  onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg text-white leading-none">{selectedToken.name}</h2>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-md font-bold">{selectedToken.symbol}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono tracking-tight break-all select-all">{selectedToken.tokenAddress}</div>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed border-t border-cardBorder/50 pt-3">{selectedToken.description}</p>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-background/40 p-3 rounded-xl border border-cardBorder/30">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Supply</div>
                  <div className="text-sm font-black text-white mt-1">{parseFloat(selectedToken.totalSupply).toLocaleString()}</div>
                </div>
                <div className="bg-background/40 p-3 rounded-xl border border-cardBorder/30">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Creator</div>
                  <div className="text-sm font-black text-white mt-1 font-mono">{selectedToken.creator.slice(0, 6)}...{selectedToken.creator.slice(-4)}</div>
                </div>
              </div>
            </div>

            {/* Split Receivers List (Persistent from localStorage) */}
            {currentTokenMetadata && currentTokenMetadata.splits && (
              <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Coins size={14} className="text-primary" />
                  Earning Share splits ({currentTokenMetadata.splits.length})
                </div>
                <div className="space-y-2">
                  {currentTokenMetadata.splits.map((rec: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-background/50 border border-cardBorder/40 p-3 rounded-2xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                          {rec.address.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-white">{rec.address}</div>
                          <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">{rec.type}</div>
                        </div>
                      </div>
                      <span className="font-black text-primary">{rec.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trading Widget */}
            <div className="bg-cardBg border border-cardBorder rounded-3xl p-5 space-y-4 shadow-xl">
              {/* Buy/Sell Toggles */}
              <div className="flex bg-background p-1.5 rounded-2xl border border-cardBorder">
                <button 
                  onClick={() => { setSwapType("buy"); setSwapAmount(""); setSwapOutput("0.00"); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${swapType === "buy" ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white"}`}
                >
                  Buy {selectedToken.symbol}
                </button>
                <button 
                  onClick={() => { setSwapType("sell"); setSwapAmount(""); setSwapOutput("0.00"); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${swapType === "sell" ? "bg-red-500 text-white shadow" : "text-gray-400 hover:text-white"}`}
                >
                  Sell {selectedToken.symbol}
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
          </div>
        )}
      </main>

      {/* 5. STICKY BOTTOM NAVBAR (Flaunch.gg Mobile Layout Copy) */}
      <nav className="fixed bottom-5 left-1/2 transform -translate-x-1/2 w-[calc(100%-24px)] max-w-[424px] bg-cardBg/95 backdrop-blur-md border border-cardBorder/80 py-3.5 px-5 flex justify-between items-center z-50 shadow-2xl rounded-[24px]">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView("home")}
            className={`p-2 rounded-xl transition-all ${currentView === "home" ? "text-primary scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <HomeIcon size={22} className={currentView === "home" ? "fill-current" : ""} />
          </button>
          
          <button 
            onClick={() => setShowSearch(true)}
            className={`p-2 rounded-xl transition-all ${showSearch ? "text-primary scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <Search size={22} />
          </button>

          <button 
            onClick={() => setCurrentView("launch")}
            className={`p-2 rounded-xl transition-all ${currentView === "launch" ? "text-primary scale-105" : "text-gray-400 hover:text-white"}`}
          >
            <Plus size={24} className="stroke-[2.5px]" />
          </button>
        </div>

        {/* Connect Button inside the Navbar - Match Flaunch.gg perfectly */}
        <div>
          {!ready ? (
            <div className="w-24 h-9 bg-cardBorder animate-pulse rounded-full" />
          ) : authenticated ? (
            <button 
              onClick={() => logout()}
              className="px-4 py-2 rounded-full bg-cardBorder hover:bg-opacity-80 text-white font-extrabold text-[11px] flex items-center gap-1.5 transition-all border border-cardBorder"
            >
              <Wallet size={12} className="text-primary" />
              {activeWallet?.address ? `${activeWallet.address.slice(0, 4)}...${activeWallet.address.slice(-3)}` : "Profile"}
            </button>
          ) : (
            <button 
              onClick={() => login()}
              className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-[0.97] font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Wallet size={12} />
              Connect wallet
            </button>
          )}
        </div>
      </nav>

      {/* 6. FLAUNCH-STYLE SEARCH BOTTOM DRAWER */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-[#0F0F16] border-t border-cardBorder rounded-t-[32px] p-5 space-y-4 shadow-2xl relative animate-slide-up pb-[env(safe-area-inset-bottom,24px)]">
            {/* Drag handle */}
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-1"></div>
            
            {/* Trending Title */}
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider pl-1 pb-1">
              <Flame size={14} className="text-primary animate-pulse" />
              Trending
            </div>

            {/* Trending Coins List inside Search Drawer */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-none">
              {filteredTokens.slice(0, 3).map((token: any, i: number) => {
                const isUp = i % 2 === 0;
                return (
                  <div 
                    key={i} 
                    className="bg-cardBg border border-cardBorder rounded-2xl p-3.5 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      setSelectedToken(token);
                      setSwapAmount("");
                      setSwapOutput("0.00");
                      setCurrentView("details");
                      setShowSearch(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={token.imageUrl} 
                        alt={token.symbol} 
                        className="w-10 h-10 rounded-full object-cover bg-neutral-800"
                        onError={(e: any) => { e.target.src = "https://placeholder.co/150" }}
                      />
                      <div>
                        <div className="font-extrabold text-white text-xs">{token.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-white">$970.1K</div>
                      <div className={`text-[10px] font-black flex items-center justify-end gap-0.5 mt-0.5 ${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? "+1.8%" : "-1.2%"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Search Input Box - Sits inside Drawer, matching Flaunch perfectly */}
            <div className="relative pt-2 border-t border-cardBorder/50">
              <input 
                type="text" 
                placeholder="Search coins, CA, users"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-cardBorder rounded-2xl py-3.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
              />
              <Search className="absolute left-3.5 top-[23px] text-gray-500" size={16} />
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                className="absolute right-3.5 top-[22px] p-1 rounded-full bg-cardBorder hover:bg-neutral-800 text-gray-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
