import { Connection, PublicKey } from '@solana/web3.js';
import { Raydium } from '@raydium-io/raydium-sdk-v2';
import type { 
    ApiPoolInfoV4, 
    PoolsApiReturn, 
    ApiV3PoolInfoItem
} from '@raydium-io/raydium-sdk-v2';
import axios from 'axios';
import CONFIG from '../config/config';
import { PoolInfo } from '../types/pool';
import logger from '../utils/logger';
import { withRetry } from '../utils/retry';

interface PoolDetails {
    price: number;
    liquidity: number;
    volume24h: number;
}

type RaydiumPool = ApiV3PoolInfoItem | ApiPoolInfoV4;

interface PoolListResponse {
    count: number;
    data: RaydiumPool[];
    hasNextPage: boolean;
}

export class PoolMonitor {
    private knownPools: Set<string>;
    private connection: Connection;
    private raydium!: Raydium;

    constructor() {
        this.knownPools = new Set<string>();
        this.connection = new Connection(CONFIG.RPC_ENDPOINT);
    }

    public async initialize(): Promise<void> {
        try {
            logger.info('[INFO] Initializing Raydium SDK...');
            this.raydium = await Raydium.load({
                connection: this.connection,
                disableLoadToken: true
            });
            logger.info('[INFO] Raydium SDK initialized successfully');
        } catch (error) {
            logger.error('[ERROR] Failed to initialize Raydium SDK:', error);
            throw error;
        }
    }

    private getPoolMints(pool: RaydiumPool): { 
        mintA: string, 
        mintB: string, 
        mintDecimalsA: number, 
        mintDecimalsB: number,
        lpMint: string 
    } {
        if ('baseMint' in pool && 'quoteMint' in pool) {
            // V4 Concentrated pool
            return {
                mintA: pool.baseMint,
                mintB: pool.quoteMint,
                mintDecimalsA: pool.baseDecimals,
                mintDecimalsB: pool.quoteDecimals,
                lpMint: pool.lpMint
            };
        } else if ('type' in pool && pool.type === 'Standard' && 'mintA' in pool && 'mintB' in pool) {
            // V3 Standard pool
            const poolData = pool as any;
            return {
                mintA: poolData.mintA.address,
                mintB: poolData.mintB.address,
                mintDecimalsA: poolData.mintA.decimals,
                mintDecimalsB: poolData.mintB.decimals,
                lpMint: poolData.lpMint.address
            };
        } else if ('type' in pool && pool.type === 'Concentrated') {
            // V3 Concentrated pool
            const poolData = pool as any;
            return {
                mintA: poolData.mintA.address,
                mintB: poolData.mintB.address,
                mintDecimalsA: poolData.mintA.decimals,
                mintDecimalsB: poolData.mintB.decimals,
                lpMint: '' // Concentrated pools don't have LP tokens
            };
        } else {
            logger.warn('[WARN] Unknown pool structure:', {
                id: (pool as any).id,
                type: (pool as any).type,
                pool: JSON.stringify(pool, null, 2)
            });
            return {
                mintA: '',
                mintB: '',
                mintDecimalsA: 0,
                mintDecimalsB: 0,
                lpMint: ''
            };
        }
    }

    private getPoolPrice(pool: RaydiumPool): number {
        if ('price' in pool && typeof pool.price === 'number') {
            return pool.price;
        }
        
        // For concentrated pools, calculate price from current tick
        if ('currentPrice' in pool && typeof pool.currentPrice === 'number') {
            return pool.currentPrice;
        }

        return 0;
    }

    private getPoolLiquidity(pool: RaydiumPool): number {
        if ('liquidity' in pool && typeof pool.liquidity === 'number') {
            return pool.liquidity;
        }

        // For concentrated pools, use TVL
        if ('tvl' in pool && typeof pool.tvl === 'number') {
            return pool.tvl;
        }

        return 0;
    }

    private getPoolVolume(pool: RaydiumPool): number {
        if ('volume24h' in pool && typeof pool.volume24h === 'number') {
            return pool.volume24h;
        }

        return 0;
    }

    private async getPoolDetails(pool: RaydiumPool): Promise<PoolDetails> {
        try {
            // Fetch pool info from API
            const poolInfo = await this.raydium.api.fetchPoolById({
                ids: pool.id
            });

            if (!poolInfo || !Array.isArray(poolInfo) || poolInfo.length === 0) {
                logger.warn(`[WARN] Failed to get pool info for ${pool.id}`);
                return { price: 0, liquidity: 0, volume24h: 0 };
            }

            const details = poolInfo[0];

            // Calculate price and liquidity
            const price = this.getPoolPrice(details);
            const liquidity = this.getPoolLiquidity(details);
            const volume24h = this.getPoolVolume(details);

            logger.info(`[DEBUG] Pool ${pool.id} details:`, {
                price,
                liquidity,
                volume24h,
                type: 'type' in details ? details.type : 'unknown'
            });

            return {
                price,
                liquidity,
                volume24h
            };
        } catch (error) {
            logger.error(`[ERROR] Failed to get pool details for ${pool.id}:`, error);
            return {
                price: 0,
                liquidity: 0,
                volume24h: 0
            };
        }
    }

    private async getAllPoolPages(): Promise<RaydiumPool[]> {
        const allPools: RaydiumPool[] = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            try {
                logger.info(`[INFO] Fetching pool list page ${page}...`);
                const response = await Promise.race([
                    this.raydium.api.getPoolList({ page }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout fetching pool list')), 30000)
                    )
                ]) as PoolListResponse;
                
                if (!response || !response.data || !Array.isArray(response.data)) {
                    logger.warn(`[WARN] Invalid response for page ${page}:`, response);
                    break;
                }

                allPools.push(...response.data);
                hasNextPage = response.hasNextPage;
                page++;

                if (allPools.length >= 1000) {
                    logger.warn('[WARN] Reached maximum pool limit (1000), stopping pagination');
                    break;
                }
            } catch (error) {
                logger.error(`[ERROR] Failed to fetch pool list page ${page}:`, error);
                break;
            }
        }

        return allPools;
    }

    private formatPoolInfo(pool: any, details: PoolDetails, mints: any): void {
        const tokenSymbol = pool.mintA?.symbol || 'Unknown';
        const quoteSymbol = pool.mintB?.symbol || 'WSOL';
        const mintAddress = pool.mintA?.address || '';
        const poolAddress = pool.id || '';
        const price = details.price;
        const supply = pool.mintAmountA || 0;
        const fdv = price * supply;
        const liquidity = details.liquidity;

        logger.info(`[INFO] New Pool Detected: ${tokenSymbol}/${quoteSymbol}`);
        logger.info(`[INFO] Token: ${tokenSymbol}`);
        logger.info(`[INFO] Mint Address: ${mintAddress}`);
        logger.info(`[INFO] Pool Address: ${poolAddress}`);
        logger.info(`[INFO] Circulating Supply: ${supply.toLocaleString()}`);
        logger.info(`[INFO] Price: ${price}`);
        logger.info(`[INFO] FDV: ${fdv.toLocaleString()}`);
        logger.info(`[INFO] Liquidity: ${liquidity.toLocaleString()}`);

        if (fdv > 0 && fdv <= CONFIG.TARGET_FDV && liquidity >= CONFIG.MIN_LIQ_TO_BUY) {
            logger.info(`[INFO] Trigger Buy! Token Address: ${mintAddress}, FDV: ${fdv.toLocaleString()}, Liquidity: ${liquidity.toLocaleString()}, Holding: 0 (simulated)`);
        } else if (fdv === 0) {
            logger.info(`[INFO] Skipping buy signal - Invalid FDV (price: ${price}, supply: ${supply})`);
        } else if (liquidity < CONFIG.MIN_LIQ_TO_BUY) {
            logger.info(`[INFO] Skipping buy signal - Insufficient liquidity: ${liquidity.toLocaleString()} (minimum required: ${CONFIG.MIN_LIQ_TO_BUY.toLocaleString()})`);
        }
    }

    private async getRaydiumPools(): Promise<PoolInfo[]> {
        try {
            logger.info('[INFO] Fetching Raydium pools...');
            
            const poolsData = await this.getAllPoolPages();
            const newPools = poolsData.filter(pool => !this.knownPools.has(pool.id));
            
            if (newPools.length > 0) {
                logger.info(`[INFO] Found ${newPools.length} new pools`);
            }

            if (newPools.length === 0) {
                return [];
            }

            const batchSize = 10;
            const results: PoolInfo[] = [];

            for (let i = 0; i < newPools.length; i += batchSize) {
                const batch = newPools.slice(i, i + batchSize);
                
                if (batch.length > 0) {
                    logger.info(`[INFO] Processing ${batch.length} new pools...`);
                }

                // Process pools in parallel
                const poolDetailsPromises = batch.map(pool => this.getPoolDetails(pool));
                const poolDetailsArray = await Promise.all(poolDetailsPromises);
                const poolDetails = Object.fromEntries(
                    batch.map((pool, index) => [pool.id, poolDetailsArray[index]])
                );

                for (const pool of batch) {
                    if (!pool || typeof pool !== 'object' || !('id' in pool)) {
                        logger.warn('[WARN] Invalid pool data:', pool);
                        continue;
                    }

                    const details = poolDetails[pool.id] || {
                        price: 0,
                        liquidity: 0,
                        volume24h: 0
                    };

                    try {
                        const mints = this.getPoolMints(pool);
                        
                        // Format and log pool information
                        this.formatPoolInfo(pool, details, mints);

                        const poolInfo: PoolInfo = {
                            id: pool.id,
                            ...mints,
                            price: details.price,
                            tvl: details.liquidity,
                            volume24h: details.volume24h,
                            ammConfig: {
                                id: '1',
                                index: 0,
                                protocolFeeRate: 0,
                                tradeFeeRate: 0,
                                tickSpacing: 1,
                                fundFeeRate: 0,
                                fundOwner: '',
                                description: ''
                            },
                            rewardInfos: []
                        };
                        results.push(poolInfo);
                        
                        // Add to known pools
                        this.knownPools.add(pool.id);
                    } catch (error) {
                        logger.error(`[ERROR] Error processing pool ${pool.id}:`, error);
                    }
                }
            }

            if (results.length > 0) {
                logger.info(`[INFO] Successfully processed ${results.length} new pools`);
            }
            return results;
        } catch (error) {
            logger.error('[ERROR] Error fetching Raydium pools:', error);
            return [];
        }
    }

    public async start(): Promise<void> {
        try {
            await this.initialize();
            
            const pools = await this.getRaydiumPools();
            logger.info(`[INFO] Initial pool fetch complete. Found ${pools.length} pools.`);

            setInterval(async () => {
                try {
                    const pools = await this.getRaydiumPools();
                    logger.info(`[INFO] Pool check complete. Found ${pools.length} pools.`);
                } catch (error) {
                    logger.error('[ERROR] Error in pool monitoring interval:', error);
                }
            }, CONFIG.POOL_CHECK_INTERVAL);
        } catch (error) {
            logger.error('[ERROR] Error starting pool monitor:', error);
            throw error;
        }
    }
}
