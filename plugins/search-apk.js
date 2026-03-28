// ✅ Coded by JawadTechX
// 🔍 Command: playstore / ps / appsearch
// 📁 Category: utility

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
  pattern: "playstore",
  alias: ["ps", "appsearch"],
  desc: "Search any Android app from Play Store.",
  category: "utility",
  react: "📱",
  use: ".playstore <app name>",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args[0]) return reply("📍 Please provide an app name.\n\nExample: *.playstore Free Fire*");

    const query = args.join(" ");
    const apiUrl = `https://api.hanggts.xyz/search/playstore?q=${encodeURIComponent(query)}`;
    
    const { data } = await axios.get(apiUrl);
    if (!data.status || !data.result || data.result.length === 0) {
      return reply("❌ No results found for your query.");
    }

    const app = data.result[0]; // Show only the first result

    const caption = `
📱 *PLAY STORE APP FOUND!*

🏷️ *Name:* ${app.nama}
👨‍💻 *Developer:* ${app.developer}
⭐ *Rating:* ${app.rate2}
🌐 *App Link:* ${app.link}
🧑‍💻 *Dev Page:* ${app.link_dev}

🔋 *Powered By JawadTechX 🇵🇰*
    `.trim();

    await conn.sendMessage(from, {
      image: { url: app.img },
      caption
    }, { quoted: mek });

  } catch (err) {
    console.error("PLAYSTORE SEARCH ERROR:", err);
    reply("⚠️ Error fetching Play Store results. Please try again later.");
  }
});
