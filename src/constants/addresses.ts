// Contract addresses for local development/testing
export const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory
export const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router 02

// Sample tokens using well-known addresses
export const SAMPLE_TOKENS = [
  {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Mainnet WETH
    decimals: 18
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet USDC
    decimals: 6
  },
  {
    name: "Dai Stablecoin",
    symbol: "DAI",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // Mainnet DAI
    decimals: 18
  },
  {
    name: "Tether USD",
    symbol: "USDT",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet USDT
    decimals: 6
  }
];

// Known Pairs (WETH-USDC and WETH-DAI pairs on mainnet)
export const KNOWN_PAIRS = [
  {
    address: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", // WETH-USDC
    name: "WETH/USDC"
  },
  {
    address: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11", // WETH-DAI
    name: "WETH/DAI"
  }
];