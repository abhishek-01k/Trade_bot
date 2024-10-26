import { QuotePayload, Transactionprops } from "@/types/trade";
import { ODOS_URL } from "./Brian";

export const generateQuote = async ({
  chainId,
  userAddr,
  inputTokenAddress,
  outputTokenAddress,
  amount,
}: QuotePayload) => {
  try {
    const res = await fetch(`${ODOS_URL}/sor/quote/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        chainId,
        userAddr,
        inputTokens: [{ tokenAddress: inputTokenAddress, amount: amount }],
        outputTokens: [{ tokenAddress: outputTokenAddress, proportion: 1 }],
      }),
    });

    const response = await res.json();
    console.log("Quote fetched >>", response);
    return response;
  } catch (error) {
    console.log("Error in fetching quote", error);
  }
};

export const generateTransaction = async ({
  userAddr,
  pathId,
}: Transactionprops) => {
  try {
    const res = await fetch(`${ODOS_URL}/sor/assemble`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        userAddr,
        pathId,
      }),
    });

    const response = await res.json();
    console.log("Quote fetched >>", response);
    return response;
  } catch (error) {
    console.log("Error in fetching quote", error);
  }
};
