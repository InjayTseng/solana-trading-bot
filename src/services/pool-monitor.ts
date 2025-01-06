import { Connection, PublicKey } from '@solana/web3.js';
import { Raydium } from '@raydium-io/raydium-sdk-v2';
import type { ApiPoolInfoV4 } from '@raydium-io/raydium-sdk-v2';
import axios from 'axios';
import { CONFIG } from '../config/config';
import { PoolInfo } from '../types/pool';
import { logger } from '../utils/logger';
import { withRetry } from '../utils/retry';

interface PoolDetails {
    price: number;
    liquidity: number;
    volume24h: number;
}

export class PoolMonitor {
    private knownPools: Set<string>;
    private connection: Connection;
    private raydium!: Raydium; // Using definite assignment assertion

    constructor() {
        this.knownPools = new Set<string>();
        this.connection = new Connection(CONFIG.RPC_ENDPOINT);
    }

    public async initialize(): Promise<void> {
        try {
            logger.info('Initializing Raydium SDK...');
            this.raydium = await Raydium.load({
                connection: this.connection,
                disableLoadToken: true // We don't need token info for now
            });
            logger.info('Raydium SDK initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Raydium SDK:', error);
            throw error;
        }
    }

    private async getRaydiumPools(): Promise<PoolInfo[]> {
        try {
            logger.info('Fetching Raydium pools...');
            
            // First, get the pool list
            const poolList = await this.raydium.api.getPoolList({});
            logger.info('Raw pool list:', JSON.stringify(poolList, null, 2));

            if (!poolList || typeof poolList !== 'object') {
                logger.warn('Invalid pool list returned:', poolList);
                return [];
            }

            // Then get detailed info for each pool
            const poolIds = Object.keys(poolList);
            if (poolIds.length === 0) {
                logger.warn('No pools found in pool list');
                return [];
            }

            logger.info('Pool IDs:', poolIds);

            const poolDetailsResponse = await this.raydium.api.fetchPoolById({
                ids: poolIds.join(',')
            });
            
            if (!poolDetailsResponse) {
                logger.warn('No pool details returned from API');
                return [];
            }

            logger.info('Pool details response:', JSON.stringify(poolDetailsResponse, null, 2));

            const poolDetails = Object.fromEntries(
                Object.entries(poolDetailsResponse)
                    .filter(([_, details]) => details !== null)
                    .map(([id, details]: [string, any]) => [
                        id,
                        {
                            price: details?.price || 0,
                            liquidity: details?.amountTotal || 0,
                            volume24h: details?.volumeUsd || 0
                        }
                    ])
            );
            logger.info('Processed pool details:', JSON.stringify(poolDetails, null, 2));

            const results: PoolInfo[] = [];
            
            for (const [id, pool] of Object.entries(poolList)) {
                if (!pool || typeof pool !== 'object') {
                    logger.warn(`Invalid pool data for ID ${id}:`, pool);
                    continue;
                }

                const details = poolDetails[id] || {
                    price: 0,
                    liquidity: 0,
                    volume24h: 0
                };
                
                logger.info('Processing pool:', {
                    id,
                    pool: JSON.stringify(pool, null, 2),
                    details: JSON.stringify(details, null, 2)
                });

                try {
                    const poolInfo: PoolInfo = {
                        id,
                        mintA: (pool as any).baseMint || '',
                        mintB: (pool as any).quoteMint || '',
                        mintDecimalsA: (pool as any).baseDecimals || 0,
                        mintDecimalsB: (pool as any).quoteDecimals || 0,
                        price: details.price,
                        tvl: details.liquidity,
                        volume24h: details.volume24h,
                        lpMint: (pool as any).lpMint || '',
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
                } catch (error) {
                    logger.error(`Error processing pool ${id}:`, error);
                }
            }

            logger.info(`Successfully processed ${results.length} pools`);
            return results;
        } catch (error) {
            logger.error('Error fetching Raydium pools:', error);
            return [];
        }
    }

    public async start(): Promise<void> {
        try {
            await this.initialize();
            
            // Initial fetch
            const pools = await this.getRaydiumPools();
            logger.info(`Initial pool fetch complete. Found ${pools.length} pools.`);

            // Start monitoring
            setInterval(async () => {
                try {
                    const pools = await this.getRaydiumPools();
                    logger.info(`Pool check complete. Found ${pools.length} pools.`);
                } catch (error) {
                    logger.error('Error in pool monitoring interval:', error);
                }
            }, CONFIG.POOL_CHECK_INTERVAL);
        } catch (error) {
            logger.error('Error starting pool monitor:', error);
            throw error;
        }
    }
}
