const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadDB, saveDB } = require('./utils/db');

// --- কনফিগারেশন লোড করা (CONFIG.JSON) ---
let config = {};
try {
  // config.json ফাইলটি লোড করা
  const configPath = path.join(__dirname, 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    config = require(configPath);
    console.log('✅ Config loaded from config.json');
  } else {
    throw new Error('config/config.json file not found.');
  }
} catch (err) {
  console.error(`❌ FATAL: Configuration load failed: ${err.message}`);
  // কনফিগারেশন লোড না হলে প্রোগ্রাম বন্ধ করে দেওয়া ভালো
  process.exit(1); 
}
// ------------------------------------------

const app = express();
// config.json এ PORT না থাকলে ডিফল্ট PORT 3000 ব্যবহার করবে
const port = config.PORT || 3000; 

app.get('/', (req, res) => {
  res.send('🤖 Telegram bot is live and using polling!');
});

// Uptime tracker & globals
global.botStartTime = Date.now();
global.activeEmails = {};
// GLOBAL এ CONFIG ও PREFIX যোগ করা হলো, যাতে সহজেই অন্য ফাইল থেকে অ্যাক্সেস করা যায়।
global.CONFIG = config; 
global.PREFIX = config.PREFIX || '/'; // config.json এ PREFIX না থাকলে ডিফল্ট '/' ব্যবহার করবে

(async () => {
  try {
    // ✅ Load DB (from remote if available)
    const db = await loadDB();
    global.userDB = db;
  } catch (err) {
    console.warn('⚠️ Failed to load DB:', err.message);
    global.userDB = { approved: [], pending: [], banned: [] };
  }

  // ✅ Start the bot after DB is ready
  // config.json থেকে BOT_TOKEN ব্যবহার করা
  const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

  // ✅ Polling error catcher
  bot.on("polling_error", (error) => {
    console.error("❌ Polling error:", error.response?.data || error.message || error);
  });
  
  // ✅ Load all command files from /commands
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath);
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          // command ফাংশনে bot এর সাথে config এবং PREFIX পাঠানো হলো
          const command = require(path.join(commandsPath, file));
          if (typeof command === 'function') {
            command(bot, config, global.PREFIX);
          }
        } catch (err) {
          console.error(`❌ Error in ${file}:`, err.message);
        }
      }
    }
  }

  // ✅ Start express server (needed for Render / UptimeRobot)
  app.listen(port, () => {
    console.log(`✅ Bot server running via polling on port ${port}`);
    console.log(`Command Prefix set to: ${global.PREFIX}`);
  });
})();
