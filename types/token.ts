export interface Token {
  name: string;
  symbol: string;
  assetId: string;
  address: string;
  decimals: number;
  chainId: string;
}

export interface ChainTokens {
  [assetId: string]: Token;
}

export interface TokensType {
  [chainId: number]: ChainTokens;
}
