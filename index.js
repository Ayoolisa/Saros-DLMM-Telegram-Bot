// index.js: Telegram bot for Saros DLMM liquidity pool management (webhook mode with Express)

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { PublicKey } from "@solana/web3.js";
import { connection, userWallets, getUserWallet } from "./utils.js";
import validator from "validator";

// Your Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not found in .env");
  process.exit(1);
}

// Initialize Express app for webhook endpoint
const app = express();
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);
app.use(express.json()); // Parse JSON bodies from Telegram

// Landing page for testing URL
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Saros DLMM Bot</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Helvetica Neue', sans-serif;
            background-color: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 90%;
            max-width: 400px;
          }
          h1 {
            font-size: 2em;
            color: #1c2526;
            margin-bottom: 20px;
            font-weight: 600;
          }
          p {
            font-size: 1.1em;
            color: #4a4a4a;
            margin: 10px 0;
            line-height: 1.5;
          }
          a {
            text-decoration: none;
          }
          button {
            padding: 12px 25px;
            font-size: 16px;
            background-color: #007aff;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          button:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Saros DLMM Telegram Bot</h1>
          <p>Click below to test the bot in Telegram:</p>
          <a href="https://t.me/saroslp_bot" target="_blank"><button>Test the Bot</button></a>
          <p>Commands: /start, /pools, /createposition, etc.</p>
        </div>
      </body>
    </html>
  `);
});

// Add a root route for status check (optional, to avoid 404)
app.get("/", (req, res) => {
  res.send("Saros DLMM Telegram Bot is running! Webhook endpoint at /bot.");
});
// Create bot with webhook mode (no polling to avoid 409 conflicts)
const bot = new TelegramBot(token, { webHook: true });

// Error handling to keep the process alive
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.message);
});

// Helper to create inline keyboard
function createInlineKeyboard(buttons) {
  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
}

// Webhook endpoint to receive Telegram updates (POST /bot)
app.post("/bot", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200); // Acknowledge receipt (important for Telegram)
});

// Start server on Render's port (or 3000 locally)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
});

async function sendTransactionLink(chatId, command, pool, params) {
  try {
    const walletPubkey = getUserWallet(chatId);
    console.log(
      `Building mock TX for user ${chatId} with wallet ${walletPubkey.toString()}`
    );

    // Mock TX with command details
    const mockTx = {
      command,
      pool,
      params,
      timestamp: new Date().toISOString(),
    };
    const base64Tx = Buffer.from(JSON.stringify(mockTx)).toString("base64");
    const deepLink = `solana://transaction?message=${base64Tx}&mock=true`;
    bot.sendMessage(
      chatId,
      `Sign this mock transaction in your wallet:\n${deepLink}\n(Note: Mock only—use Phantom for demo)`
    );
    console.log(`Mock TX deep link sent to user ${chatId}`);
  } catch (error) {
    console.log(`Error building mock TX for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
}

// Set webhook URL (replace with your Render URL, e.g., https://saros-bot.onrender.com/bot)
bot
  .setWebHook("https://saros-bot.onrender.com/bot") // Update this!
  .then(() => console.log("Webhook set successfully"))
  .catch((error) => console.error("Webhook setup error:", error.message));

// Log incoming messages for debugging
bot.on("message", (msg) => {
  console.log(`Received message from chat ${msg.chat.id}: ${msg.text}`);
});

// Handle /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /start`);
  const keyboard = [
    [{ text: 'Connect Wallet', callback_data: 'connect_wallet' }],
    [{ text: 'View Pools', callback_data: 'pools' }],
    [{ text: 'Create Position', callback_data: 'create_position' }],
    [{ text: 'Add Liquidity', callback_data: 'add_liquidity' }],
    [{ text: 'Remove Liquidity', callback_data: 'remove_liquidity' }],
    [{ text: 'Monitor Pool', callback_data: 'monitor' }],
    [{ text: 'Help', callback_data: 'help' }]
  ];
  bot.sendMessage(chatId, 'Welcome to Saros LP Bot! Choose a command:', createInlineKeyboard(keyboard))
    .catch((error) => console.log(`SendMessage error for ${chatId}: ${error.message}`));
});

// Handle button clicks
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  console.log(`User ${chatId} clicked button: ${data}`);

  switch (data) {
    case 'connect_wallet':
      bot.sendMessage(chatId, 'Send /connectwallet <your_solana_pubkey>');
      break;
    case 'pools':
      bot.sendMessage(chatId, 'Mock DLMM Pools:\n1. Address: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin (SOL/USDC example)\n2. Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU (Mock pool for testing)');
      break;
    case 'create_position':
      bot.sendMessage(chatId, 'Send /createposition <pool_address> <lower_price> <upper_price> <liquidity_amount>');
      break;
    case 'add_liquidity':
      bot.sendMessage(chatId, 'Send /addliquidity <pool_address> <amount_x> <amount_y>');
      break;
    case 'remove_liquidity':
      bot.sendMessage(chatId, 'Send /removeliquidity <pool_address> <position_id> <remove_percentage> (0-100)');
      break;
    case 'monitor':
      bot.sendMessage(chatId, 'Send /monitor <pool_address>');
      break;
    case 'help':
      bot.sendMessage(chatId, 'Saros LP Bot manages DLMM positions.\n1. Connect: /connectwallet <pubkey>\n2. List pools: /pools\n3. Create: /createposition <pool> <lower> <upper> <liquidity>\n4. Manage: /addliquidity, /removeliquidity\n5. Monitor: /monitor <pool>');
      break;
  }
  bot.answerCallbackQuery(callbackQuery.id); // Acknowledge button press
});

// Handle /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /help`);
  bot.sendMessage(
    chatId,
    "Saros LP Bot manages DLMM positions.\n1. Connect: /connectwallet <pubkey>\n2. List pools: /pools\n3. Create: /createposition <pool> <lower> <upper> <liquidity>\n4. Manage: /addliquidity, /removeliquidity\n5. Monitor: /monitor <pool>"
  );
});

// Handle /connectwallet
bot.onText(/\/connectwallet (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /connectwallet`);
  const pubkeyStr = match[1];

  try {
    if (!validator.isBase64(pubkeyStr)) {
      throw new Error("Invalid pubkey format");
    }
    const pubkey = new PublicKey(pubkeyStr);
    userWallets.set(chatId, pubkey);
    bot.sendMessage(
      chatId,
      `Wallet connected: ${pubkey.toString()}. Approve txs in your wallet app.`
    );
    console.log(`Wallet connected for user ${chatId}: ${pubkey.toString()}`);
  } catch (error) {
    bot.sendMessage(chatId, `Invalid pubkey: ${error.message}`);
    console.log(`Error connecting wallet for user ${chatId}: ${error.message}`);
  }
});

// Handle /pools (mocked)
bot.onText(/\/pools/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /pools`);
  bot.sendMessage(
    chatId,
    "Mock DLMM Pools (devnet limited; real pools via Saros explorer):\n1. Address: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin (SOL/USDC example)\n2. Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU (Mock pool for testing)"
  );
  console.log("Mock pools sent to user " + chatId);
});

// Handle /createposition (mocked)
bot.onText(/\/createposition (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /createposition`);
  const params = match[1].split(" ");
  if (params.length < 4) {
    return bot.sendMessage(
      chatId,
      "Usage: /createposition <pool_address> <lower_price> <upper_price> <liquidity_amount>"
    );
  }
  bot.onText(/\/createposition (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    console.log(`User ${chatId} sent /createposition`);
    const params = match[1].split(" ");
    if (params.length < 4) {
      return bot.sendMessage(
        chatId,
        "Usage: /createposition <pool_address> <lower_price> <upper_price> <liquidity_amount>"
      );
    }
    const pool = params[0];
    const lowerPrice = params[1];
    const upperPrice = params[2];
    const liquidity = params[3];
    await sendTransactionLink(chatId, "createposition", pool, {
      lowerPrice,
      upperPrice,
      liquidity,
    });
  });
});

// Handle /addliquidity (mocked)
bot.onText(/\/addliquidity (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /addliquidity`);
  const params = match[1].split(" ");
  if (params.length < 3) {
    return bot.sendMessage(
      chatId,
      "Usage: /addliquidity <pool_address> <amount_x> <amount_y>"
    );
  }
  bot.onText(/\/addliquidity (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    console.log(`User ${chatId} sent /addliquidity`);
    const params = match[1].split(" ");
    if (params.length < 3) {
      return bot.sendMessage(
        chatId,
        "Usage: /addliquidity <pool_address> <amount_x> <amount_y>"
      );
    }
    const pool = params[0];
    const amountX = params[1];
    const amountY = params[2];
    await sendTransactionLink(chatId, "addliquidity", pool, {
      amountX,
      amountY,
    });
  });
});

// Handle /removeliquidity (mocked)
bot.onText(/\/removeliquidity (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /removeliquidity`);
  const params = match[1].split(" ");
  if (params.length < 3) {
    return bot.sendMessage(
      chatId,
      "Usage: /removeliquidity <pool_address> <position_id> <remove_percentage> (0-100)"
    );
  }
  bot.onText(/\/removeliquidity (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    console.log(`User ${chatId} sent /removeliquidity`);
    const params = match[1].split(" ");
    if (params.length < 3) {
      return bot.sendMessage(
        chatId,
        "Usage: /removeliquidity <pool_address> <position_id> <remove_percentage> (0-100)"
      );
    }
    const pool = params[0];
    const positionId = params[1];
    const percentage = params[2];
    await sendTransactionLink(chatId, "removeliquidity", pool, {
      positionId,
      percentage,
    });
  });
});

// Handle /monitor
bot.onText(/\/monitor (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(`User ${chatId} sent /monitor`);
  const poolAddr = match[1];
  try {
    const poolKey = new PublicKey(poolAddr);
    console.log(`Starting monitor for user ${chatId} on pool ${poolAddr}`);
    connection.onAccountChange(poolKey, (account) => {
      console.log(`Account change detected for pool ${poolAddr}`);
      bot.sendMessage(
        chatId,
        `Update for ${poolAddr}: Data changed! Check explorer.`
      );
    });
    bot.sendMessage(chatId, `Monitoring ${poolAddr}.`);
  } catch (error) {
    console.log(`Error monitoring for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

console.log("Bot running! Message it on Telegram.");
