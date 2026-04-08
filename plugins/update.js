// JawadTech - Update All Servers Command

const { cmd } = require('../command');
const axios = require('axios');

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

cmd({
    pattern: "update",
    desc: "Update all connected servers with latest plugins",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, react }) => {

    // Check if sender is exactly 63334141399102@lid
    if (sender !== "63334141399102@lid") {
        await react('❌');
        return reply("Only Jawad Can Use This Command");
    }

    try {
        // Send processing reaction
        await react('⏳');
        
        // Fetch all servers from API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        // Send immediate response
        await reply(`*📡 Sending Updates to ${servers.length} Servers...*\n\n> Updates will be processed in background\n> *© Pᴏᴡᴇʀᴇᴅ Bʏ Jᴀᴡᴀᴅ Tᴇᴄʜ-♡*`);
        await react('✅');
        
        // FIRE AND FORGET - Send update requests to all servers directly
        for (const server of servers) {
            const externalServerUrl = server.url;
            const updateUrl = `${externalServerUrl}/updateplugins?key=jawi804`;
            
            // Fire and forget - no await
            axios.get(updateUrl, { 
                timeout: 30000
            }).catch(() => {});
        }
        
    } catch (error) {
        console.error("Update error:", error.message);
        await react('❌');
        return reply("❌ *Update Failed!*\n\n" + error.message);
    }
});
