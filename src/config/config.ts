import dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';

dotenv.config();

interface Config {
    RPC_ENDPOINT: string;
    CHECK_INTERVAL: number;
    TRADING_ENABLED: boolean;
    TARGET_FDV: number;
    TAKE_PROFIT_FDV: number;
    TAKE_LOSS_FDV: number;
    CLUSTER_URL: string;
    POOL_CHECK_INTERVAL: number;
    MIN_LIQ_TO_BUY: number;
    LOG_LEVEL: string;
    getConnection(): Connection;
}

const CONFIG: Config = {
    RPC_ENDPOINT: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60000'),
    TRADING_ENABLED: process.env.TRADING_ENABLED === 'true',
    TARGET_FDV: parseInt(process.env.TARGET_FDV || '1000000'),
    TAKE_PROFIT_FDV: parseFloat(process.env.TAKE_PROFIT_FDV || '2000000'),
    TAKE_LOSS_FDV: parseFloat(process.env.TAKE_LOSS_FDV || '700000'),
    CLUSTER_URL: process.env.CLUSTER_URL || 'mainnet-beta',
    POOL_CHECK_INTERVAL: parseInt(process.env.POOL_CHECK_INTERVAL || '60000'),
    MIN_LIQ_TO_BUY: parseInt(process.env.MIN_LIQ_TO_BUY || '200000'),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    getConnection(): Connection {
        return new Connection(this.CLUSTER_URL, 'confirmed');
    }
};

export default CONFIG;
