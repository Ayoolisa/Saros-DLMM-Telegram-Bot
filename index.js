// index.js: Telegram bot for Saros DLMM liquidity pool management (webhook mode with Express)
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { PublicKey, Connection } from '@solana/web3.js';
import { connection, dlmm, userWallets, getUserWallet } from './utils.js';

// Initialize Express app
const app = express();
app.use(express.json()); // Parse JSON bodies from Telegram

// Telegram Bot Token
const token = '8489885216:AAHKortMPZFzWM1tIECjFW41YSXVORpl9dA';
const bot = new TelegramBot(token, { polling: false }); // Webhook mode, polling disabled

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
});

// Helper function for mock transaction links
async function sendTransactionLink(chatId, command, pool, params) {
  try {
    const walletPubkey = getUserWallet(chatId);
    console.log(`Building mock TX for ${command} - user ${chatId} with wallet ${walletPubkey.toString()}`);

    // Mock TX with command details
    const mockTx = {
      command,
      pool,
      params,
      timestamp: new Date().toISOString()
    };
    const base64Tx = Buffer.from(JSON.stringify(mockTx)).toString('base64');
    const deepLink = `solana://transaction?message=${base64Tx}&mock=true`;
    bot.sendMessage(chatId, `Sign this mock transaction in your wallet:\n${deepLink}\n(Note: Mock only—use Phantom for demo)`)
      .then(() => console.log(`Sent mock TX link for ${command} to ${chatId}`))
      .catch((error) => console.error(`SendMessage error for ${chatId}: ${error.message}`));
  } catch (error) {
    console.log(`Error building mock TX for user ${chatId}: ${error.message}`);
    bot.sendMessage(chatId, `Error: ${error.message}. Connect wallet first with /connectwallet <pubkey>.`)
      .then(() => console.log(`Sent error message to ${chatId}`))
      .catch((error) => console.error(`SendMessage error for ${chatId}: ${error.message}`));
  }
}

// Webhook endpoint
app.post('/bot', (req, res) => {
  console.log('=== Webhook Received ===');
  console.log('Full update:', JSON.stringify(req.body, null, 2));
  
  if (req.body.message) {
    console.log('Message type:', req.body.message.text);
    console.log('Chat ID:', req.body.message.chat.id);
  }
  
  bot.processUpdate(req.body);
  console.log('Update processed');
  console.log('========================');
  res.sendStatus(200);
});

// Landing page
app.get("/", (req, res) => {
  const isDlmmActive = dlmm !== null && dlmm !== undefined; // Check dlmm status
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Essential for mobile scaling -->
        <title>Saros DLMM Bot</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
         @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');
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
            font-family: 'Bricolage Grotesque', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            transition: background-color 0.3s ease, color 0.3s ease;
          }
          header {
            background: var(--card-color);
            padding: 10px 20px;
            box-shadow: var(--shadow);
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-direction: row; /* Row on all screens */
          }
          header h1 {
            font-size: 1.5em;
            margin: 0;
            font-weight: 400;
          }
          .toggle {
            background: var(--button-bg);
            color: var(--card-color);
            border: none;
            border-radius: 20px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 0.9em;
            transition: opacity 0.2s;
          }
          .toggle:hover {
            opacity: 0.8;
          }
          .container {
            flex: 1 0 auto;
            max-width: 1200px;
            width: 90%;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
            box-sizing: border-box;
            display: flex;
            flex-direction: column; /* Column for all containers */
          }
          .card {
            background-color: var(--card-color);
            color: var(--text-color);
            padding: 20px;
            border-radius: 15px;
            box-shadow: var(--shadow);
            margin: 20px auto;
            width: 100%;
            max-width: 800px;
            transition: background-color 0.3s ease, color 0.3s ease;
          }
          h1 {
            font-size: 2em;
            margin-bottom: 10px;
            font-weight: 400;
          }
          h2 {
            font-size: 1.6em;
            margin-top: 30px;
            font-weight: 400;
          }
          p {
            font-size: 1.1em;
            color: var(--text-secondary);
            line-height: 1.6;
            margin: 15px 0;
          }
          .features {
            display: flex;
            flex-direction: row; /* Row on desktop */
            gap: 20px;
            margin: 30px 0;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
          }
          .feature-card {
            background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
            padding: 20px;
            border-radius: 10px;
            transition: transform 0.2s;
            width: 300px;
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
          .demo-container {
            margin: 30px 0;
            max-width: 100%;
          }
          .demo-video {
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
            border-radius: 15px;
            box-shadow: var(--shadow);
          }
          .demo-video iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
          }
          footer {
            flex-shrink: 0;
            background: var(--card-color);
            padding: 10px 20px;
            box-shadow: var(--shadow);
            text-align: center;
            margin-top: auto;
          }
          footer p {
            font-size: 0.9em;
            margin: 0;
          }
          footer a {
            color: var(--button-bg);
            text-decoration: none;
          }
          footer a:hover {
            text-decoration: underline;
          }

          @media (max-width: 600px) {
            .container {
              padding: 10px;
              width: 95%;
            }
            .card {
              padding: 15px;
              margin: 10px auto;
              max-width: none;
            }
            h1 {
              font-size: 1.8em;
            }
            h2 {
              font-size: 1.4em;
            }
            p {
              font-size: 1em;
            }
            button {
              padding: 10px 20px;
              font-size: 14px;
            }
            .features {
              flex-direction: column; /* Column on mobile */
              gap: 15px;
              align-items: center;
            }
            .feature-card {
              max-width: 100%;
            }
            .demo-container {
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Saros DLMM Bot</h1>
          <button class="toggle" onclick="toggleTheme()">🌙 Dark Mode</button>
        </header>
        <div class="container">
          <div class="card">
            <h1>Saros DLMM Telegram Bot</h1>
            <p>Empower your DeFi journey with seamless liquidity management on Solana's Saros DLMM. Built for retail LPs, this bot offers mobile-first tools to create positions, add/remove liquidity, and monitor pools in real-time—all from Telegram.</p>
            <a href="https://t.me/saroslp_bot" target="_blank"><button>Test the Bot</button></a>
          </div>

          <div class="card">
            <h2>What Can It Do?</h2>
            <p>Designed for ease and security, the bot handles complex DLMM tasks with simple commands. No apps, no wallets—just chat and trade.</p>
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
            <p><strong>Ready for Testnet</strong>: Mock features now; full Mainnet after validation. ${
              isDlmmActive
                ? "DLMM SDK active."
                : "DLMM SDK unavailable (demo mode)."
            }</p>
          </div>

          <div class="demo-container">
            <h2>Watch the Demo</h2>
            <div class="demo-video">
              <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Saros DLMM Bot Demo" frameborder="0" allowfullscreen></iframe>
            </div>
            <p>Explore how to use the bot with this quick video guide.</p>
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
        </div>
        <footer>
          <p>&copy; 2025 Saros DLMM Bot | <a href="https://github.com/Ayoolisa/Saros-DLMM-Telegram-Bot" target="_blank">GitHub</a> | Built with ❤️ by Ayoolisa</p>
        </footer>

        <script>
          const toggle = document.querySelector('.toggle');
          if (toggle) {
            toggle.addEventListener('click', () => {
              const body = document.body;
              const currentTheme = body.dataset.theme || 'light';
              const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
              body.dataset.theme = newTheme;
              toggle.textContent = newTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
              localStorage.setItem('theme', newTheme);
            });
          } else {
            console.error('Toggle button not found');
          }

          // Load saved theme
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme) {
            document.body.dataset.theme = savedTheme;
            if (toggle) toggle.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
          }
        </script>
      </body>
    </html>
  `);
});

// Set webhook on bot startup
const port = process.env.PORT || 10000;
const webhookUrl = `https://saros-bot.onrender.com/bot`;
bot
  .setWebHook(webhookUrl)
  .then(() => {
    console.log("Webhook set successfully");
  })
  .catch((err) => {
    console.error("Error setting webhook:", err);
  });

// Start the server
app.listen(port, () => {
  console.log(`Bot server running on port ${port}`);
});


bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error.message);
});