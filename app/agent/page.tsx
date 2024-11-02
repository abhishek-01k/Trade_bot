"use client";
import { ethers } from "ethers";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, PenSquare, Send, Play, Info, Timer, RotateCcw, Languages, Building2, Bot, UserRound } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import brian from "@/lib/brian";
import { executeRoute, getRoutes } from "@lifi/sdk";
import { SwapPayload } from "@/types/trade";
import {
  getChainIdByChainName,
  getTokenBasedOnChain,
  processAmount,
} from "@/constants/TokenDetails";
import { ErrorToast } from "@/lib/error";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { generateQuote, generateTransaction } from "@/config/odosTransaction";
import { BeatLoader } from "react-spinners";
import { mainnet } from "thirdweb/chains";
import { novesChains } from "@/config/noveschains";
import { Skeleton } from "@/components/ui/skeleton";
import GasFeesTimer from "@/components/bot/GasFeesTimer";

async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  console.log(`Translating: ${text} to ${targetLang}`);
  return `Translated: ${text}`;
}

type MessageContent = string | { __html: string };

export default function MultiChainAITrading() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: MessageContent;
      originalContent?: string;
      canExecute?: boolean;
    }>
  >([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState("en");
  const [protocol, setProtocol] = useState("askme");
  const recognitionRef = useRef<SpeechRecognitionResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  // odos swap
  const [quotePathId, setQuotePathId] = useState("");
  const totalTime = 60;
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);

  // Add these new state variables at the beginning of your component
  const [txnOption, setTxnOption] = useState<"history" | "hash" | null>(null);
  const [selectedChain, setSelectedChain] = useState("");
  const [txHash, setTxHash] = useState("");
  const [historicalAddress, setHistoricalAddress] = useState("");

  // useEffect(() => {
  //   let timer: NodeJS.Timeout | null = null; // Declare timer variable

  //   if (isActive) {
  //     timer = setInterval(() => {
  //       setTimeLeft((prev) => {
  //         if (prev === 1) {
  //           setQuotePathId("");
  //           return totalTime; // Reset timer to 60 seconds
  //         }
  //         return prev - 1; // Decrease timer
  //       });
  //     }, 1000); // Update every second
  //   }

  //   return () => {
  //     if (timer) clearInterval(timer); // Cleanup on unmount
  //   };
  // }, [isActive]);

  // const { address } = useWeb3ModalAccount()
  const activeAccount = useActiveAccount();
  const wallet = useActiveWallet();

  console.log("This runs");

  const userWalletAddress = activeAccount?.address;

  const { mutate: sendAndConfirmTx, data: transactionReceipt } =
    useSendAndConfirmTransaction();

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (currentMessage.trim()) {
      // Checking ODOS chains request first
      if (currentMessage === "Show me the supported chains for ODOS") {
        try {
          const response = await fetch("https://api.odos.xyz/info/chains");
          const data = await response.json();

          // Format the chain IDs in a readable way
          const chainList = data.chains.join(", ");

          setMessages((prev) => [
            ...prev,
            {
              role: "user",
              content: currentMessage,
            },
            {
              role: "assistant",
              content: `ODOS supports the following chain IDs: ${chainList}`,
            },
          ]);
          setCurrentMessage("");
          return;
        } catch (error) {
          console.error("Error fetching ODOS chains:", error);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Sorry, I couldn't fetch the supported chains at the moment.",
            },
          ]);
          return;
        }
      }

      let translatedMessage = currentMessage;
      let originalMessage = undefined;

      if (language !== "en") {
        translatedMessage = await translateText(currentMessage, "en");
        originalMessage = currentMessage;
      }

      // Only add the user message here if it's not the ODOS chains request
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: translatedMessage,
          originalContent: originalMessage,
        },
      ]);
      setCurrentMessage("");
      setIsEditing(false);

      // Process the message with Brian
      const result = await brian.extract({
        prompt: translatedMessage,
      });

      console.log("Brian Result:", result);

      // Simulate AI response
      if (result) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I've received your command: "${translatedMessage}". ${result
                ? "I can execute this transaction for you."
                : "I couldn't process this as a transaction."
                }`,
              canExecute: !!result,
            },
          ]);
        }, 1000);
      }
    }
  };

  const executeTransaction = async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message.canExecute) return;

    if (!userWalletAddress) {
      alert("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    const result = await brian.extract({
      prompt: message.content,
    });

    console.log("executing txn with result", result);

    if (!result) {
      setIsLoading(false);
      ErrorToast("Something went wrong during execution.");
      return;
    }

    const { action, amount, token1, token2, chain, address } =
      result.completion[0];

    if (!token1 || !token2 || !action || !amount) {
      setIsLoading(false);
      ErrorToast("Something went wrong during execution.");
      return;
    }

    const currentChainId = await wallet?.getChain();

    const fetchedChain = getChainIdByChainName(chain);

    const sourceChainToken = getTokenBasedOnChain({
      chainId: fetchedChain.id,
      tokenName: token1.toLowerCase(),
    });

    const destinationChainToken = getTokenBasedOnChain({
      chainId: fetchedChain.id,
      tokenName: token2.toLowerCase(),
    });

    const parsedAmount = processAmount(amount, sourceChainToken?.decimals);

    if (currentChainId && currentChainId.id !== fetchedChain.id) {
      await wallet?.switchChain(fetchedChain);
    }

    if (!sourceChainToken || !destinationChainToken || !parsedAmount) {
      ErrorToast("Missing Data While Executing Transaction. Please try again");
      return;
    }

    if (protocol === "odos") {
      if (action === "swap") {
        try {
          const quoteFetched = await generateQuote({
            chainId: fetchedChain.id.toString(),
            userAddr: userWalletAddress,
            inputTokenAddress: sourceChainToken?.address as string,
            outputTokenAddress: destinationChainToken?.address as string,
            amount: parsedAmount as string,
          });

          console.log("quoteFetched", quoteFetched);

          const { pathId } = quoteFetched;

          if (!pathId) {
            ErrorToast("Failed to get quote from ODOS");
            return;
          }

          // Generate and execute transaction
          const transactionQuote = await generateTransaction({
            userAddr: userWalletAddress,
            pathId: pathId,
          });

          console.log("ODOS Transaction quote:", transactionQuote);
          const { transaction } = transactionQuote;

          const txResult = await activeAccount.sendTransaction(transaction);
          console.log("ODOS Transaction result:", txResult);

          // Add success message to chat
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Successfully executed ODOS swap transaction. Hash: ${txResult.transactionHash}`,
            },
          ]);
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
          console.log("Error in fetching and executing swap", error);
          ErrorToast("Failed to execute swap transaction");
        }
      }
    } else if (result.completion[0].chain == "rootstock") {
      console.log(
        "Parsed Amount >>>",
        parsedAmount,
        sourceChainToken,
        destinationChainToken
      );

      if (action === "swap") {
        await handleSwap({
          fromChainId: Number(sourceChainToken.chainId),
          toChainId: Number(destinationChainToken.chainId),
          fromTokenAddress: sourceChainToken.address,
          toTokenAddress: destinationChainToken.address,
          amount: parsedAmount,
        });
      }
    } else if (result && userWalletAddress) {
      console.log("Executing Transaction >>", result, address);
      const transactionResult = await brian.transact({
        ...result,
        address: userWalletAddress,
        chainId: chain ? `${fetchedChain.id}` : `${mainnet.id}`,
      });

      console.log("Transaction Result:", transactionResult);

      const { data } = transactionResult[0];
      const { steps } = data;
      if (steps) {
        console.log("Steps >>", steps);
        for (const step of steps) {
          const { from, to, value, data } = step;

          const tx = {
            from: from,
            to,
            value: BigInt(value), // Default to "0" if value is not provided
            data,
          };
          console.log("Tx >>", tx);

          try {
            const hash = await sendAndConfirmTx(tx);
            console.log("Transaction Hash >>", hash);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Transaction executed successfully. Hash: ${hash}`,
              },
            ]);
          } catch (error: any) {
            console.error("Transaction Error >>", error);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Error executing transaction: ${error.message}`,
              },
            ]);
            break; // Stop further transactions if one fails
          }
        }
      }
    }
  };

  // @kamal call this func according to the payloads LIFI
  const handleSwap = async ({
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    amount,
  }: SwapPayload) => {
    try {
      if (!userWalletAddress) {
        console.log("no wallet address");
      }

      const result = await getRoutes({
        fromChainId,
        toChainId,
        fromTokenAddress: fromTokenAddress, // USDC on Arbitrum
        toTokenAddress: toTokenAddress, // DAI on Optimism
        fromAmount: amount, // amount in string with decimals included
        fromAddress: userWalletAddress,
      });

      const route = result.routes[0];

      const executedRoute = await executeRoute(route, {
        // Gets called once the route object gets new updates
        updateRouteHook(route) {
          console.log(route);
        },
      });
    } catch (error) {
      console.log("Error", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSupportedChains = () => {
    setCurrentMessage("Show me the supported chains for ODOS");
  };

  // @kamal txn options
  const TxnOptionsSelect = () => {
    return (
      <div className="flex flex-col space-y-4 w-full">
        <Select
          value={txnOption || ""}
          onValueChange={(value: "history" | "hash") => setTxnOption(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Transaction Option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="history">See Wallet History</SelectItem>
            <SelectItem value="hash">Get Info by Transaction Hash</SelectItem>
          </SelectContent>
        </Select>

        {txnOption && (
          <>
            <Select
              value={selectedChain}
              onValueChange={(chainName) => setSelectedChain(chainName)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Chain" />
              </SelectTrigger>
              <SelectContent>
                {novesChains.map((chain) => (
                  <SelectItem key={chain.evmChainId} value={chain.name}>
                    {chain.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={historicalAddress}
              onChange={(e) => setHistoricalAddress(e.target.value)}
              placeholder="Enter Address"
              className="w-full"
            />
          </>
        )}

        {txnOption === "hash" && (
          <Input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Enter Transaction Hash"
            className="w-full"
          />
        )}
      </div>
    );
  };

  // Add this new function to handle transaction queries
  const handleTxnQuery = async () => {
    setIsLoading(true);
    try {
      console.log(process.env.NEXT_PUBLIC_NOVES_API_KEY, "noves api key");
      if (txnOption === "history") {
        const response = await fetch(
          `https://translate.noves.fi/evm/${selectedChain}/history/${historicalAddress}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              apiKey: process.env.NEXT_PUBLIC_NOVES_API_KEY as string,
            },
          }
        );
        const data = await response.json();

        // Process each transaction
        for (const tx of data.items) {
          const txDetails = await fetch(
            `https://translate.noves.fi/evm/${selectedChain}/raw/tx/${tx.transactionHash}`,
            {
              method: "GET",
              headers: {
                accept: "application/json",
                apiKey: process.env.NEXT_PUBLIC_NOVES_API_KEY as string,
              },
            }
          );
          const txData = await txDetails.json();
          // Get generated key for inspector URL
          const keyResponse = await fetch(
            `https://extension-gateway.noves.fi/evm/${selectedChain}/generateInspectorLink/${tx.transactionHash}`,
            {
              method: 'GET',
              headers: {
                accept: '*/*',
                apiKey: process.env.NEXT_PUBLIC_NOVES_API_KEY as string
              }
            }
          );

          console.log(keyResponse, "key response", keyResponse.text());
          const generatedKey = await keyResponse.text();

          const inspectorUrl = `https://inspector.noves.fi/${selectedChain}/${tx.transactionHash}?key=${generatedKey}`;

          setMessages(prev => [...prev, {
            role: "assistant",
            content: {
              __html: `
                <div>
                  <p><strong>Transaction Details:</strong></p>
                  <p>• Hash: ${tx.transactionHash}</p>
                  <p>• Block: ${tx.blockNumber}</p>
                  <p>• Timestamp: ${new Date(tx.timestamp * 1000).toLocaleString()}</p>
                  <p>• Type: ${txData.classificationData?.type || 'Unknown'}</p>
                  <p>• Description: ${txData.classificationData?.description || 'N/A'}</p>
                  <p>
                    <strong>View in Inspector:</strong> 
                    <a href="${inspectorUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline">
                      ${inspectorUrl}
                    </a>
                  </p>
                </div>
              `.trim()
            }
          }]);
        }
      } else if (txnOption === "hash") {
        const response = await fetch(
          `https://translate.noves.fi/evm/${selectedChain}/tx/${txHash}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              apiKey: process.env.NEXT_PUBLIC_NOVES_API_KEY as string,
            },
          }
        );
        const data = await response.json();

        const keyResponse = await fetch(
          `https://extension-gateway.noves.fi/evm/${selectedChain}/generateInspectorLink/${txHash}`,
          {
            method: 'GET',
            headers: {
              accept: '*/*',
              apiKey: process.env.NEXT_PUBLIC_NOVES_API_KEY as string
            }
          }
        );

        const a = await keyResponse.text();
        console.log(a, "a");

        const inspectorUrl = `https://inspector.noves.fi/${selectedChain}/${txHash}?key=${a}`;

        setMessages(prev => [...prev, {
          role: "assistant",
          content: {
            __html: `
              <div>
                <p><strong>Transaction Details:</strong></p>
                <p>• Type: ${data.classificationData?.type || 'Unknown'}</p>
                <p>• Description: ${data.classificationData?.description || 'N/A'}</p>
                <p>• From: ${data.rawTransactionData?.fromAddress}</p>
                <p>• To: ${data.rawTransactionData?.toAddress}</p>
                <p>• Gas Used: ${data.rawTransactionData?.gasUsed}</p>
                <p>• Timestamp: ${new Date(data.rawTransactionData?.timestamp * 1000).toLocaleString()}</p>
                <p>
                  <strong>View in Inspector:</strong> 
                  <a href="${inspectorUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline">
                    ${inspectorUrl}
                  </a>
                </p>
              </div>
            `.trim()
          }
        }]);
      }
    } catch (error) {
      console.error("Error fetching transaction data:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error fetching the transaction data.",
        },
      ]);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto h-[700px] flex flex-col p-6">
        <CardHeader className="flex flex-col  px-6 py-6">
          <CardTitle className="text-3xl font-bold">
            Multichain AI Trading
          </CardTitle>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            <GasFeesTimer />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Choose language
                </CardTitle>

                <div className="flex flex-row items-center gap-1">
                  <Languages size={20} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col mt-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Select Method
                </CardTitle>

                <div className="flex flex-row items-center gap-1">
                  <Building2 size={20} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col mt-3">
                <Select value={protocol} onValueChange={setProtocol}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select Protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="odos">ODOS</SelectItem>
                    <SelectItem value="askme">Ask Me</SelectItem>
                    <SelectItem value="txn">Get Info about a txn</SelectItem>
                    <SelectItem value="swap">Swap</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto px-6 py-6">
          {protocol === "txn" && !messages.length && <TxnOptionsSelect />}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                } mb-8`}
            >
              <div
                className={`flex items-start max-w-[70%] ${message.role === "user" ? "flex-row-reverse" : ""
                  }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback>
                    {message.role === "user" ?
                      (
                        <UserRound />
                      ) : (
                        <Bot />
                      )}
                  </AvatarFallback>
                  {message.role === "assistant" && (
                    <AvatarImage
                      src="/placeholder.svg?height=48&width=48"
                      alt="AI Assistant"
                    />
                  )}
                </Avatar>
                <div
                  className={`mx-4 p-5 rounded-lg ${message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                    }`}
                >
                  {typeof message.content === 'string' ? (
                    <p className="text-base">{message.content}</p>
                  ) : (
                    <div
                      className="text-base"
                      dangerouslySetInnerHTML={message.content}
                    />
                  )}
                  {message.originalContent && (
                    <p className="text-sm mt-3 text-muted-foreground">
                      Original: {message.originalContent}
                    </p>
                  )}
                  {message.canExecute && (
                    <Button
                      onClick={() => executeTransaction(index)}
                      className="mt-3"
                      size="sm"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Execute Transaction
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* <div ref={messagesEndRef} /> */}
        </CardContent>
        <CardFooter className="px-6 py-6">
          <div className="flex w-full items-center space-x-4">
            {protocol === "odos" && (
              <Button
                variant="outline"
                onClick={handleSupportedChains}
                className="flex-shrink-0"
              >
                <Info className="mr-2 h-4 w-4" />
                Supported Chains
              </Button>
            )}
            <Button
              size="icon"
              variant={isListening ? "destructive" : "secondary"}
              onClick={toggleListening}
              className="flex-shrink-0"
            >
              {isListening ? <MicOff className="" /> : <Mic className="" />}
              <span className="sr-only">
                {isListening ? "Stop listening" : "Start listening"}
              </span>
            </Button>
            {isEditing ? (
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-grow text-lg"
                rows={3}
                placeholder={`Type your command in ${language === "en" ? "English" : "your selected language"
                  }...`}
              />
            ) : (
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Type or speak your command in ${language === "en" ? "English" : "your selected language"
                  }...`}
                className="flex-grow text-lg py-4"
              />
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-shrink-0"
            >
              <PenSquare className="" />
              <span className="sr-only">Toggle edit mode</span>
            </Button>
            {protocol === "txn" &&
              txnOption &&
              selectedChain &&
              (txnOption === "history" || txHash) && (
                <Button
                  onClick={handleTxnQuery}
                  disabled={isLoading}
                  className="flex-shrink-0"
                >
                  {isLoading ? <BeatLoader size={8} /> : "Get Transaction Info"}
                </Button>
              )}
            {isLoading ? (
              <BeatLoader />
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                className="flex-shrink-0"
              >
                <Send className="" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
