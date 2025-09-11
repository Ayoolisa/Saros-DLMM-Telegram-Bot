// utils.js: Helper functions for Solana and Saros DLMM SDK
import { Connection, PublicKey } from '@solana/web3.js';
import pkg from '@saros-finance/dlmm-sdk';
const { LiquidityBookServices } = pkg; // Try LiquidityBookServices

// Connect to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Initialize DLMM SDK
let dlmm;
try {
  dlmm = new LiquidityBookServices(connection); // Attempt initialization
  console.log('LiquidityBookServices initialized successfully');
} catch (error) {
  console.error('LiquidityBookServices initialization failed:', error.message);
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