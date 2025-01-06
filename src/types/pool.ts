export interface TokenInfo {
    mint: string;
    symbol: string;
    decimals: number;
    name?: string;
}

export interface PoolInfo {
    id: string;
    mintA: string;
    mintB: string;
    mintDecimalsA: number;
    mintDecimalsB: number;
    price: number;
    tvl: number;
    volume24h: number;
    lpMint: string;
    ammConfig: {
        id: string;
        index: number;
        protocolFeeRate: number;
        tradeFeeRate: number;
        tickSpacing: number;
        fundFeeRate: number;
        fundOwner: string;
        description: string;
    };
    rewardInfos?: Array<{
        rewardMint: string;
        rewardVault: string;
        rewardOpenTime: number;
        rewardEndTime: number;
        rewardPerSecond: string;
        rewardSender?: string;
        rewardType: "Standard SPL" | "Option tokens";
    }>;
    day?: {
        volume: number;
        volumeFee: number;
        feeA: number;
        feeB: number;
        feeApr: number;
        apr: number;
        priceMin: number;
        priceMax: number;
        rewardApr: {
            A: number;
            B: number;
            C: number;
        };
    };
    week?: {
        volume: number;
        volumeFee: number;
        feeA: number;
        feeB: number;
        feeApr: number;
        apr: number;
        priceMin: number;
        priceMax: number;
        rewardApr: {
            A: number;
            B: number;
            C: number;
        };
    };
    month?: {
        volume: number;
        volumeFee: number;
        feeA: number;
        feeB: number;
        feeApr: number;
        apr: number;
        priceMin: number;
        priceMax: number;
        rewardApr: {
            A: number;
            B: number;
            C: number;
        };
    };
}

export interface TokenMetrics {
    circulatingSupply: number;
    price: number;
    fdv: number;
}
