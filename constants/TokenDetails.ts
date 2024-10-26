import { TokensType } from "@/types/token";
import { mainnet, polygon } from "thirdweb/chains";
export const getChainIdByChainName = (chainName: string | undefined) => {
  let chain = mainnet;
  switch (chainName) {
    case "polygon":
      chain = polygon;
      break;

    default:
      break;
  }

  return chain;
};

export const getTokenBasedOnChain = ({
  chainId,
  tokenName,
}: {
  chainId: number;
  tokenName: string;
}) => {
  const chainTokens = Tokens[chainId];
  if (chainTokens) {
    return (
      Object.values(chainTokens).find((token) => token.assetId === tokenName) ||
      null
    );
  }
};

export const Tokens: TokensType = {
  1: {
    usdc: {
      name: "usdc",
      symbol: "USDC",
      assetId: "usdc",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      chainId: "1",
    },
    eth: {
      name: "Ethereum",
      symbol: "ETH",
      assetId: "eth",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      chainId: "1",
    },
    pyusd: {
      name: "PayPal USD",
      symbol: "PYUSD",
      assetId: "pyusd",
      address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
      decimals: 6,
      chainId: "1",
    },
  },
  137: {
    matic: {
      name: "Matic",
      symbol: "MATIC",
      assetId: "matic",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      chainId: "137",
    },
    usdc: {
      name: "USD Coin",
      symbol: "USDC",
      assetId: "usdc",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 18,
      chainId: "137",
    },
  },
};

export const processAmount = (amount?: string, decimals?: number) => {
  if (amount && decimals) {
    const floatAmount = parseFloat(amount);

    if (isNaN(floatAmount)) {
      throw new Error("Invalid amount provided");
    }
    if (amount.length < decimals) {
      const newAmount = BigInt(Math.floor(floatAmount * 10 ** decimals));
      return newAmount.toString(); // Return as a string
    }

    return amount;
  } else {
    return null;
  }
};
