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
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          :root {
            --bg-color: #f5f5f5;
            --card-color: #ffffff;
            --text-color: #1c2526;
            --text-secondary: #4a4a4a;
            --button-bg: #007aff;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          [data-theme="dark"] {
            --bg-color: #1a1a1a;
            --card-color: #2a2a2a;
            --text-color: #ffffff;
            --text-secondary: #b0b0b0;
            --button-bg: #0d6efd;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Helvetica Neue', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            transition: background-color 0.3s ease;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
          }
          .card {
            background-color: var(--card-color);
            padding: 30px;
            border-radius: 15px;
            box-shadow: var(--shadow);
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 600;
          }
          h2 {
            font-size: 1.8em;
            color: var(--text-color);
            margin-top: 30px;
          }
          p {
            font-size: 1.1em;
            color: var(--text-secondary);
            line-height: 1.6;
            margin: 15px 0;
          }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .feature-card {
            background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
            padding: 20px;
            border-radius: 10px;
            transition: transform 0.2s;
          }
          .feature-card:hover {
            transform: translateY(-5px);
          }
          a {
            text-decoration: none;
          }
          button {
            padding: 12px 25px;
            font-size: 16px;
            background-color: var(--button-bg);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.2s;
            animation: pulse 2s infinite;
          }
          button:hover {
            opacity: 0.9;
            transform: scale(1.05);
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
          }
          .chart-container {
            margin: 30px 0;
            max-width: 600px;
          }
          #liquidityChart {
            background: var(--card-color);
            border-radius: 10px;
            padding: 20px;
          }
          .toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--button-bg);
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 12px;
            cursor: pointer;
          }
          .toggle:hover {
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <button class="toggle" onclick="toggleTheme()">🌙 Dark Mode</button>
        <div class="container">
          <div class="card">
            <h1>Saros DLMM Telegram Bot</h1>
            <p>Empower your DeFi journey with seamless liquidity management on Solana's Saros DLMM. Built for retail LPs, this bot offers mobile-first tools to create positions, add/remove liquidity, and monitor pools in real-time—all from Telegram.</p>
            <a href="https://t.me/saroslp_bot" target="_blank"><button>Test the Bot</button></a>
          </div>

          <div class="card">
            <h2>What Can It Do?</h2>
            <p>Designed for ease and security, the bot handles complex DLMM tasks with simple commands. No apps, no wallets— just chat and trade.</p>
            <div class="features">
              <div class="feature-card">
                <h3>Connect Wallet</h3>
                <p>Securely link your Solana wallet in seconds. No private keys shared.</p>
              </div>
              <div class="feature-card">
                <h3>Manage Positions</h3>
                <p>Create, add, or remove liquidity with one command. Mock TXs for demo; real integration coming.</p>
              </div>
              <div class="feature-card">
                <h3>Real-Time Monitoring</h3>
                <p>Get alerts on pool changes and fees. Stay ahead of impermanent loss.</p>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Security & Trust</h2>
            <p>Your funds are safe—bot uses unsigned TXs for wallet signing. Rate-limited to prevent spam, and deployed on Render for 24/7 uptime. Built with Node.js, Express, and Solana Web3.js for reliability.</p>
            <p><strong>Ready for Testnet</strong>: Mock features now; full Mainnet after validation.</p>
          </div>

          <div class="card">
            <h2>How to Use</h2>
            <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
              <li>Click "Test the Bot" to start in Telegram.</li>
              <li>Send /start to see the menu.</li>
              <li>Connect your wallet with /connectwallet <pubkey>.</li>
              <li>Use /pools for mock pools, /createposition for positions, etc.</li>
              <li>Monitor with /monitor <pool_address>.</li>
            </ol>
          </div>

          <div class="chart-container">
            <h2 style="color: var(--text-color);">Mock Liquidity Chart</h2>
            <canvas id="liquidityChart" width="400" height="200"></canvas>
          </div>
        </div>

        <script>
          // Dark mode toggle
          const toggle = document.querySelector('.toggle');
          toggle.addEventListener('click', () => {
            document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            toggle.textContent = document.body.dataset.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
            localStorage.setItem('theme', document.body.dataset.theme);
          });

          // Load saved theme
          if (localStorage.getItem('theme') === 'dark') {
            document.body.dataset.theme = 'dark';
            toggle.textContent = '☀️ Light Mode';
          }

          // Mock liquidity chart with Chart.js
          const ctx = document.getElementById('liquidityChart').getContext('2d');
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['Pool 1', 'Pool 2', 'Pool 3'],
              datasets: [{
                label: 'Liquidity TVL',
                data: [50000, 75000, 120000],
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: { beginAtZero: true }
              },
              animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
              },
              plugins: {
                legend: { display: false }
              }
            }
          });

          // Fade-in animation for cards
          document.querySelectorAll('.card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, index * 200);
          });
        </script>
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
