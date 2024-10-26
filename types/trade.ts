export type SwapPayload = {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
};

export type QuotePayload = {
  chainId: string;
  userAddr: string;
  inputTokenAddress: string;
  outputTokenAddress: string;
  amount: string;
};

export type Transactionprops = {
  userAddr: string;
  pathId: string;
};
