const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { loadDB, saveDB } = require('./utils/db');

// --- কনফিগারেশন লোড করা (CONFIG.JSON) ---
let config = {};
try {
  const configPath = path.join(__dirname, 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    config = require(configPath);
    console.log('✅ Config loaded from config.json');
  } else {
    throw new Error('config/config.json file not found.');
  }
} catch (err) {
  console.error(`❌ FATAL: Configuration load failed: ${err.message}`);
  process.exit(1); 
}
// ------------------------------------------

const app = express();
const port = config.PORT || 3000; 

// Uptime tracker & globals
global.botStartTime = Date.now();
global.activeEmails = {};
global.CONFIG = config; 
global.PREFIX = config.PREFIX || '/';

// সমস্ত লোড হওয়া কমান্ডের কনফিগারেশন রাখার জন্য গ্লোবাল অ্যারে
const loadedCommands = []; 

(async () => {
  try {
    // ✅ Load DB
    const db = await loadDB();
    global.userDB = db;
  } catch (err) {
    console.warn('⚠️ Failed to load DB:', err.message);
    global.userDB = { approved: [], pending: [], banned: [] };
  }

  // ✅ Start the bot
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
          const commandModule = require(path.join(commandsPath, file));

          // **এখানে মূল পরিবর্তন:** // commandModule এখন একটি ফাংশন যা কমান্ড লজিক সেট করে এবং কনফিগারেশন রিটার্ন করে।
          if (typeof commandModule === 'function') {
            
            // ফাংশনটি কল করা হচ্ছে। এটি TelegramBot লিসেনার সেট করবে এবং কনফিগারেশন অবজেক্টটি রিটার্ন করবে।
            const commandConfig = commandModule(bot, config, global.PREFIX);
            
            // যদি কনফিগারেশন অবজেক্টটি পাওয়া যায়, তবে তা স্টোর করা হচ্ছে।
            if (commandConfig && commandConfig.config) {
                 loadedCommands.push(commandConfig.config);
                 console.log(`Command Loaded: ${commandConfig.config.name} (${commandConfig.config.aliases.join(', ') || 'No Alias'})`);
            }
          }
        } catch (err) {
          console.error(`❌ Error in ${file}:`, err.message);
        }
      }
    }
  }
  
  // ✅ লোড হওয়া কমান্ডের সংখ্যা প্রিন্ট করা
  console.log(`✅ Successfully loaded ${loadedCommands.length} command(s).`);


  // ✅ Start express server
  app.listen(port, () => {
    console.log(`✅ Bot server running via polling on port ${port}`);
    console.log(`Command Prefix set to: ${global.PREFIX}`);
  });
})();
