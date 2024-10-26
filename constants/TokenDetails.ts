export const findChainIdByName = (chainName: string | undefined) => {
  if (chainName) {
    const token = TokenManagement.find((token) => token.name === chainName);
    return token;
  } else {
    return null;
  }
};

export const TokenManagement = [
  {
    id: 1,
    chainId: 1,
    name: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
  {
    id: 2,
    chainId: 30,
    name: "RBTC",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
];

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
  }
};
