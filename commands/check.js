/**
 * @fileoverview বট স্ট্যাটাস এবং আপটাইম চেক করার কমান্ড।
 * * এই কমান্ডটি ব্যবহার করার জন্য আপনার index.js ফাইলে global.botStartTime এবং global.PREFIX সেট করা আছে বলে ধরে নেওয়া হয়েছে।
 */

module.exports = (bot, config, prefix) => {
  // config.json থেকে ADMIN_UID ব্যবহার করা হচ্ছে
  const ADMIN_UID = config.ADMIN_UID;
  
  // ডাইনামিক রেজেক্স তৈরি করা
  const checkRegex = new RegExp(`^${prefix}check$`);

  /**
   * মিলি-সেকেন্ডকে সুন্দরভাবে দিনে, ঘন্টায়, মিনিটে এবং সেকেন্ডে রূপান্তর করে।
   * @param {number} ms - সময় মিলি-সেকেন্ডে।
   * @returns {string} - ফরম্যাট করা স্ট্রিং।
   */
  const formatUptime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days} দিন`);
    if (hours > 0) parts.push(`${hours} ঘণ্টা`);
    if (minutes > 0) parts.push(`${minutes} মিনিট`);
    if (seconds > 0) parts.push(`${seconds} সেকেন্ড`);

    return parts.join(', ') || 'কিছু সেকেন্ড';
  };

  // কমান্ড লিসেনার
  bot.onText(checkRegex, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // শুধুমাত্র অ্যাডমিন UID থাকলে অ্যাডমিনকে উত্তর দেবে
    if (ADMIN_UID && userId !== ADMIN_UID) {
      console.log(`🔒 Access Denied: User ${userId} tried to use ${prefix}check command.`);
      // অপশনাল: ইউজারকে মেসেজ না দিয়ে শুধু কনসোল লগও করা যেতে পারে।
      return bot.sendMessage(chatId, "⚠️ এই কমান্ডটি শুধুমাত্র অ্যাডমিনের জন্য সংরক্ষিত।");
    }

    // গ্লোবাল আপটাইম ভ্যারিয়েবল চেক করা
    const startTime = global.botStartTime;
    if (!startTime) {
      return bot.sendMessage(chatId, "❌ আপটাইম তথ্য খুঁজে পাওয়া যায়নি।");
    }
    
    // আপটাইম গণনা
    const uptimeMs = Date.now() - startTime;
    const uptimeFormatted = formatUptime(uptimeMs);

    // মেসেজ তৈরি
    const statusMessage = `
🤖 **বট স্ট্যাটাস চেক**

- **সময়:** ${new Date().toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka' })}
- **আপটাইম (চলমান):** ${uptimeFormatted}
- **এডমিন ইউজার আইডি:** \`${ADMIN_UID}\`
- **বট টোকেন:** ✅ (লোড করা হয়েছে)
- **প্রিফিক্স:** \`${prefix}\`
`;

    bot.sendMessage(chatId, statusMessage, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  });
};
