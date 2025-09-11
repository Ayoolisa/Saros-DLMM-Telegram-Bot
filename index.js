// index.js: Telegram bot for Saros DLMM liquidity pool management (minimal demo with error handling)
import TelegramBot from 'node-telegram-bot-api';
import { PublicKey } from '@solana/web3.js';
import { connection, userWallets, getUserWallet } from './utils.js';

const token = '8489885216:AAHKortMPZFzWM1tIECjFW41YSXVORpl9dA';
const bot = new TelegramBot(token, { polling: true });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  // Optionally restart logic here, but we'll use a manager instead
});

bot.on('message', (msg) => {
  console.log(`Received message from chat ${msg.chat.id}: ${msg.text}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /start`);
  bot.sendMessage(chatId, 'Welcome to Saros LP Bot! Commands:\n/connectwallet <your_solana_pubkey>\n/pools\n/createposition <pool_address> <lower_price> <upper_price> <liquidity_amount>\n/addliquidity <pool_address> <amount_x> <amount_y>\n/removeliquidity <pool_address> <position_id> <remove_percentage>\n/monitor <pool_address>\n/help')
    .catch((error) => console.log(`SendMessage error for ${chatId}: ${error.message}`));
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /help`);
  bot.sendMessage(chatId, 'Saros LP Bot manages DLMM positions.\n1. Connect: /connectwallet <pubkey>\n2. List pools: /pools\n3. Create: /createposition <pool> <lower> <upper> <liquidity>\n4. Manage: /addliquidity, /removeliquidity\n5. Monitor: /monitor <pool>');
});

bot.onText(/\/connectwallet (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /connectwallet`);
  const pubkeyStr = match[1];
  try {
    const pubkey = new PublicKey(pubkeyStr);
    userWallets.set(chatId, pubkey);
    bot.sendMessage(chatId, `Wallet connected: ${pubkey.toString()}. Approve txs in your wallet app.`);
    console.log(`Wallet connected for user ${chatId}: ${pubkey.toString()}`);
  } catch (error) {
    bot.sendMessage(chatId, `Invalid pubkey: ${error.message}`);
    console.log(`Error connecting wallet for user ${chatId}: ${error.message}`);
  }
});

bot.onText(/\/pools/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /pools`);
  bot.sendMessage(chatId, 'Mock DLMM Pools (devnet limited; real pools via Saros explorer):\n1. Address: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin (SOL/USDC example)\n2. Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU (Mock pool for testing)');
  console.log('Mock pools sent to user ' + chatId);
});

bot.onText(/\/createposition (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /createposition`);
  const params = match[1].split(' ');
  if (params.length < 4) {
    return bot.sendMessage(chatId, 'Usage: /createposition <pool_address> <lower_price> <upper_price> <liquidity_amount>');
  }
  try {
    const walletPubkey = getUserWallet(chatId);
    console.log(`Creating position for user ${chatId} with wallet ${walletPubkey.toString()}`);
    const pool = new PublicKey(params[0]);
    const mockPositionId = `mock_${pool.toString().slice(0, 8)}`;
    bot.sendMessage(chatId, `Position created! ID: ${mockPositionId}. Sign tx in wallet (mock for demo).`);
    console.log(`Mock position created for user ${chatId}: ${mockPositionId}`);
  } catch (error) {
    console.log(`Error creating position for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error creating position: ${error.message}. Check params or connection.`);
  }
});

bot.onText(/\/addliquidity (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /addliquidity`);
  const params = match[1].split(' ');
  if (params.length < 3) {
    return bot.sendMessage(chatId, 'Usage: /addliquidity <pool_address> <amount_x> <amount_y>');
  }
  try {
    const walletPubkey = getUserWallet(chatId);
    console.log(`Adding liquidity for user ${chatId} with wallet ${walletPubkey.toString()}`);
    bot.sendMessage(chatId, `Liquidity add tx built. Sign and send via wallet (mock for demo).`);
    console.log(`Mock liquidity add for user ${chatId}`);
  } catch (error) {
    console.log(`Error adding liquidity for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error adding liquidity: ${error.message}`);
  }
});

bot.onText(/\/removeliquidity (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /removeliquidity`);
  const params = match[1].split(' ');
  if (params.length < 3) {
    return bot.sendMessage(chatId, 'Usage: /removeliquidity <pool_address> <position_id> <remove_percentage> (0-100)');
  }
  try {
    const walletPubkey = getUserWallet(chatId);
    console.log(`Removing liquidity for user ${chatId} with wallet ${walletPubkey.toString()}`);
    bot.sendMessage(chatId, `Liquidity remove tx built. Sign and send via wallet (mock for demo).`);
    console.log(`Mock liquidity remove for user ${chatId}`);
  } catch (error) {
    console.log(`Error removing liquidity for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error removing liquidity: ${error.message}`);
  }
});

bot.onText(/\/monitor (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /monitor`);
  const poolAddr = match[1];
  try {
    const poolKey = new PublicKey(poolAddr);
    console.log(`Starting monitor for user ${chatId} on pool ${poolAddr}`);
    connection.onAccountChange(poolKey, (account) => {
      console.log(`Account change detected for pool ${poolAddr}`);
      bot.sendMessage(chatId, `Update for ${poolAddr}: Data changed! Check explorer.`);
    });
    bot.sendMessage(chatId, `Monitoring ${poolAddr}.`);
  } catch (error) {
    console.log(`Error monitoring for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

console.log('Bot running! Message it on Telegram.');