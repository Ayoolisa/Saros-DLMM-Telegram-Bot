// index.js: Telegram bot with webhooks for Render
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { PublicKey } from '@solana/web3.js';
import { connection, userWallets, getUserWallet } from './utils.js';

const token = '8489885216:AAHKortMPZFzWM1tIECjFW41YSXVORpl9dA';
const bot = new TelegramBot(token, { webHook: true });
const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/bot', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
});

// Set webhook (run once)
bot.setWebHook(`https://your-app.onrender.com/bot`); // Replace with your Render URL

// All other handlers remain the same...
bot.on('message', (msg) => {
  console.log(`Received message from chat ${msg.chat.id}: ${msg.text}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /start`);
  bot.sendMessage(chatId, 'Welcome to Saros LP Bot! Commands:\n/connectwallet <your_solana_pubkey>\n/pools\n/createposition <pool_address> <lower_price> <upper_price> <liquidity_amount>\n/addliquidity <pool_address> <amount_x> <amount_y>\n/removeliquidity <pool_address> <position_id> <remove_percentage>\n/monitor <pool_address>\n/help');
});

// ... (rest of commands as before)

console.log('Bot running! Message it on Telegram.');