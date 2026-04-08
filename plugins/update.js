// JawadTech - Update All Servers Command

const { cmd } = require('../command');
const axios = require('axios');

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

// Allowed users (LID and phone number formats)
const ALLOWED_USERS = [
    '63334141399102@lid',
    '923427582273@s.whatsapp.net'
];

cmd({
    pattern: "update",
    desc: "Update all connected servers with latest plugins",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, react }) => {

    // Check if sender is allowed
    if (!ALLOWED_USERS.includes(sender)) {
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
            return reply("Failed to fetch server list");
        }
        
        const servers = serversResponse.data.servers;
        
        // Send immediate response
        await reply(`Updating Bots Successfully ✅`);
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
        return reply("Update Failed");
    }
});
