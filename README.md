# Solana Trading Bot Framework

A flexible and extensible trading bot framework for the Solana blockchain.

## Features

- Connection to Solana networks (mainnet, testnet, devnet)
- Market data fetching using Serum DEX
- Modular strategy implementation
- Configurable trading parameters
- Comprehensive logging system

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Solana wallet (JSON format)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy the sample environment file:
```bash
cp sample.env .env
```

4. Configure your environment variables in `.env`

## Configuration

Edit the `.env` file with your specific configuration:

- `CLUSTER_URL`: Solana network endpoint
- `TRADING_ENABLED`: Set to true to enable actual trading
- `MARKET_ADDRESS`: The Serum market address you want to trade on
- `MAX_TRADE_SIZE_SOL`: Maximum trade size in SOL
- `MAX_SLIPPAGE_BPS`: Maximum allowed slippage in basis points
- `WALLET_PATH`: Path to your wallet JSON file
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Usage

1. Build the project:
```bash
npm run build
```

2. Start the bot:
```bash
npm start
```

## Creating Custom Strategies

1. Create a new strategy file in `src/strategies/`
2. Implement the `Strategy` interface
3. Add your strategy logic in the `analyze` method

Example:
```typescript
import { Strategy, MarketData, TradeSignal } from './strategy.interface';

export class CustomStrategy implements Strategy {
    getName(): string {
        return 'CustomStrategy';
    }

    async analyze(marketData: MarketData): Promise<TradeSignal> {
        // Your strategy logic here
    }
}
```

## Safety Notes

- Always test your strategies on testnet first
- Start with small trade sizes
- Monitor your bot's performance regularly
- Keep your wallet keys secure

## License

MIT
