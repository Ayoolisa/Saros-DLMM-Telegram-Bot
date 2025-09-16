// utils.js: Helper functions for Solana and Saros DLMM SDK
import { Connection, PublicKey } from '@solana/web3.js';
import pkg from '@saros-finance/dlmm-sdk';

// Connect to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Initialize DLMM SDK with error handling and fallback
let dlmm;
try {
  if (typeof pkg.LiquidityBookServices === 'function') {
    dlmm = new pkg.LiquidityBookServices(connection);
    console.log('LiquidityBookServices initialized successfully with connection:', connection.rpcEndpoint);
  } else {
    console.error('LiquidityBookServices is not a constructor or undefined in @saros-finance/dlmm-sdk');
    dlmm = null;
  }
} catch (error) {
  console.error('LiquidityBookServices initialization failed:', error.message, 'Stack:', error.stack);
  dlmm = null; // Fallback for demo
}

// Store user wallets (chatId -> PublicKey)
const userWallets = new Map();

function getUserWallet(chatId) {
  const pubkey = userWallets.get(chatId);
  if (!pubkey) {
    throw new Error('No wallet connected. Use /connectwallet first.');
  }
  return pubkey;
}

export { connection, dlmm, userWallets, getUserWallet };