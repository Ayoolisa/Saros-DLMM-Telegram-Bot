# Saros DLMM Telegram Bot
A mobile-first Telegram bot for managing Saros DLMM liquidity pools. Features:
- Secure wallet connection (/connectwallet)
- Mocked position management (/pools, /createposition, /addliquidity, /removeliquidity)
- Real-time pool monitoring (/monitor)
- Automated with pm2 and deployed on Render

## Setup
1. `npm install`
2. `pm2 start index.js` or deploy to Render
3. Use Telegram commands with a Solana devnet wallet.

Built for Superteam Earn/Saros $500 bounty.
