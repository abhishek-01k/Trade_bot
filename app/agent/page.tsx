"use client";

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
import { Mic, MicOff, PenSquare, Send, Play } from "lucide-react";
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

async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  console.log(`Translating: ${text} to ${targetLang}`);
  return `Translated: ${text}`;
}

export default function MultiChainAITrading() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
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

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null; // Declare timer variable

    if (isActive) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            setQuotePathId("");
            return totalTime; // Reset timer to 60 seconds
          }
          return prev - 1; // Decrease timer
        });
      }, 1000); // Update every second
    }

    return () => {
      if (timer) clearInterval(timer); // Cleanup on unmount
    };
  }, [isActive]);

  // const { address } = useWeb3ModalAccount()
  const activeAccount = useActiveAccount();
  const wallet = useActiveWallet();

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
      let translatedMessage = currentMessage;
      let originalMessage = undefined;

      if (language !== "en") {
        translatedMessage = await translateText(currentMessage, "en");
        originalMessage = currentMessage;
      }

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
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've received your command: "${translatedMessage}". ${
              result
                ? "I can execute this transaction for you."
                : "I couldn't process this as a transaction."
            }`,
            canExecute: !!result,
          },
        ]);
      }, 1000);
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
      if (!address) {
        console.log();
      }

      const result = await getRoutes({
        fromChainId,
        toChainId,
        fromTokenAddress: fromTokenAddress, // USDC on Arbitrum
        toTokenAddress: toTokenAddress, // DAI on Optimism
        fromAmount: amount, // amount in string with decimals included
        fromAddress: address,
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

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto h-[700px] flex flex-col p-6">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-6">
          <CardTitle className="text-3xl font-bold">
            Multichain AI Trading
          </CardTitle>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[200px]">
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
          <Select value={protocol} onValueChange={setProtocol}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="odos">ODOS</SelectItem>
              <SelectItem value="askme">Ask Me</SelectItem>
              <SelectItem value="txn">Get Info about a txn</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto px-6 py-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } mb-8`}
            >
              <div
                className={`flex items-start max-w-[70%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback>
                    {message.role === "user" ? "U" : "AI"}
                  </AvatarFallback>
                  {message.role === "assistant" && (
                    <AvatarImage
                      src="/placeholder.svg?height=48&width=48"
                      alt="AI Assistant"
                    />
                  )}
                </Avatar>
                <div
                  className={`mx-4 p-5 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-base">{message.content}</p>
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
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="px-6 py-6">
          <div className="flex w-full items-center space-x-4">
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
                placeholder={`Type your command in ${
                  language === "en" ? "English" : "your selected language"
                }...`}
              />
            ) : (
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Type or speak your command in ${
                  language === "en" ? "English" : "your selected language"
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
