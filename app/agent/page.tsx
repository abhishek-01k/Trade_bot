import React, { Suspense } from "react";
import TradeAIAssistant from "@/components/bot/TradeAssisstant";
import { Spinner } from "@/components/Spinner";

const TradeAgentPage = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <TradeAIAssistant />
    </Suspense>
  );
};

export default TradeAgentPage;
