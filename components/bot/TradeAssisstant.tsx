"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send } from "lucide-react";

const convertVoiceToText = async (audioBlob: Blob): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing time
  return "This is a simulated voice-to-text conversion.";
};

export default function TradeAIAssistant() {
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (text.trim()) {
      setMessages((prev) => [...prev, { text, isUser: true }]);
      setInputText("");

      // Simulate bot response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: `Bot: I received your message: "${text}"`, isUser: false },
        ]);
      }, 1000);
    }
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const text = await convertVoiceToText(audioBlob);
          handleSendMessage(text);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-12">
      <CardHeader>
        <CardTitle>AI Chatbot</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 p-2 rounded-lg ${
                message.isUser
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-secondary"
              } max-w-[80%] ${
                message.isUser
                  ? "float-right clear-both"
                  : "float-left clear-both"
              }`}
            >
              {message.text}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex space-x-2 w-full">
          <Input
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && handleSendMessage(inputText)
            }
          />
          <Button onClick={() => handleSendMessage(inputText)}>
            <Send className="h-4 w-4" />
          </Button>
          <Button
            className={`w-10 ${
              isRecording ? "bg-red-500 hover:bg-red-600" : ""
            }`}
            onClick={handleVoiceInput}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
