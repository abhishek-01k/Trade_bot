"use client"
import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ethers } from 'ethers';
import { RotateCcw, Timer } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const GasFeesTimer = () => {
    const [baseFeePerGas, setBaseFeePerGas] = useState<string>("0");
    const [timer, setTimer] = useState<number>(60);
    const [loadingData, setLoadingData] = useState(false);

    const getGasEstimation = async () => {

        try {
            // setLoadingData(true);

            const quicknodewss = process.env.NEXT_PUBLIC_QUICKNODE_WSS || "";

            const provider = new ethers.WebSocketProvider(
                quicknodewss
            );

            console.log("Provider", provider);

            const network = await provider.send("bn_gasPrice", [{ "chainid": 1 }]);
            console.log("network", network);

            const { blockPrices } = network;
            const baseFeePerGas = blockPrices[0].baseFeePerGas;
            setBaseFeePerGas(baseFeePerGas);
            setTimer(60);
            setLoadingData(false)
        } catch (error) {
            console.log("Error", error);
            setLoadingData(false)

        }
    };

    useEffect(() => {
        getGasEstimation();

        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    getGasEstimation();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Base Gas Fees
                </CardTitle>

                <div className="flex flex-row items-center gap-1">
                    <Timer size={20} />
                    <span className="text-sm">{timer}</span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <div className="text-2xl font-bold">{
                    loadingData ? (
                        <Skeleton className="h-8 max-w-32" />
                    ) : (
                        <>
                            {baseFeePerGas} Gwei
                        </>
                    )
                }</div>
                <div onClick={getGasEstimation} className="text-xs cursor-pointer text-muted-foreground flex flex-row gap-2 items-center">
                    <RotateCcw size={16} />
                    Refresh
                </div>
            </CardContent>
        </Card>
    );
};

export default GasFeesTimer;