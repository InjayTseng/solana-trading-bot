# Solana Trading Bot

A TypeScript-based trading bot for monitoring and trading on Raydium DEX pools on the Solana blockchain.

## Features

- Real-time monitoring of new Raydium liquidity pools
- Support for both V3 and V4 pool types (Standard and Concentrated)
- Automatic FDV (Fully Diluted Valuation) calculation
- Trading signals based on configurable FDV thresholds
- Detailed logging of pool information and trading activities

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- Solana CLI (optional, for wallet management)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-trading-bot.git
cd solana-trading-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the sample:
```bash
cp sample.env .env
```

4. Configure your environment variables in `.env`:
```env
RPC_ENDPOINT=your_solana_rpc_endpoint
CHECK_INTERVAL=60000
TRADING_ENABLED=false
TARGET_FDV=1000000
TAKE_PROFIT_FDV=2000000
TAKE_LOSS_FDV=500000
CLUSTER_URL=https://api.mainnet-beta.solana.com
POOL_CHECK_INTERVAL=60000
```

## Usage

1. Build the project:
```bash
npm run build
```

2. Start the bot:
```bash
npm start
```

The bot will start monitoring Raydium pools and output information in the following format:
```
[INFO] New Pool Detected: TOKEN/WSOL
[INFO] Token: TOKEN
[INFO] Mint Address: <token_mint_address>
[INFO] Pool Address: <pool_address>
[INFO] Circulating Supply: 1,000,000
[INFO] Price: 0.5
[INFO] FDV: 500,000
[INFO] Trigger Buy! Token Address: <token_mint_address>, FDV: 500,000, Holding: 0 (simulated)
```

## Configuration

- `RPC_ENDPOINT`: Your Solana RPC endpoint
- `CHECK_INTERVAL`: Interval between pool checks (in milliseconds)
- `TRADING_ENABLED`: Enable/disable actual trading
- `TARGET_FDV`: Target Fully Diluted Valuation for buy signals
- `TAKE_PROFIT_FDV`: FDV level for taking profits
- `TAKE_LOSS_FDV`: FDV level for cutting losses
- `CLUSTER_URL`: Solana cluster URL
- `POOL_CHECK_INTERVAL`: Interval for checking new pools

## Development

1. Run in development mode:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This bot is for educational purposes only. Use at your own risk. The authors take no responsibility for financial losses incurred through the use of this software.
