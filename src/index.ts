import { config } from 'dotenv';
import { PoolMonitor } from './services/pool-monitor';
import { logger } from './utils/logger';

// Load environment variables
config();

async function main() {
    try {
        const poolMonitor = new PoolMonitor();
        await poolMonitor.start();
        
        logger.info('Bot started successfully');
        
        // Keep the process running
        process.on('SIGINT', () => {
            logger.info('Shutting down...');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
