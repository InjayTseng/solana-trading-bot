import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
    RPC_ENDPOINT: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60000'),
    TRADING_ENABLED: process.env.TRADING_ENABLED === 'true',
    TARGET_FDV: parseFloat(process.env.TARGET_FDV || '1000000'),
    TAKE_PROFIT_FDV: parseFloat(process.env.TAKE_PROFIT_FDV || '3000000'),
    TAKE_LOSS_FDV: parseFloat(process.env.TAKE_LOSS_FDV || '700000'),
    CLUSTER_URL: process.env.CLUSTER_URL || 'mainnet-beta',
    POOL_CHECK_INTERVAL: parseInt(process.env.POOL_CHECK_INTERVAL || '60000'),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    getConnection(): Connection {
        return new Connection(this.CLUSTER_URL, 'confirmed');
    }
};
