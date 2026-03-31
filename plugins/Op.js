const { cmd } = require('../command');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "sendch",
    desc: "Send monitored channel data file",
    category: "owner",
    react: "📁",
    filename: __filename
},
async (conn, mek, m, { from, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❌ Owner only command");
        
        const filePath = path.join(__dirname, '..', 'lib', 'channel.json');
        
        if (!await fs.pathExists(filePath)) {
            return reply("❌ No channel data file found");
        }
        
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            return reply("❌ Channel data file is empty");
        }
        
        // Send as document
        await conn.sendMessage(from, {
            document: await fs.readFile(filePath),
            fileName: 'channel.json',
            mimetype: 'application/json',
            caption: '📊 *Channel Monitor Data*\n\nFile contains all poll activities from monitored channel'
        }, { quoted: mek });
        
    } catch (e) {
        console.error(e);
        reply("❌ Error sending file: " + e.message);
    }
});
