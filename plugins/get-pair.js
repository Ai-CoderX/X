const { cmd, commands } = require('../command');
const axios = require('axios');

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code for JAWAD-MD bot",
    category: "owner",
    use: ".pair 923427582XXX",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply, react }) => {
    try {
        // Send processing reaction
        await react('⏳');
        
        // Extract phone number from command
        const phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : senderNumber.replace(/[^0-9]/g, '');

        // Validate phone number format
        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return await reply("❌ Please provide a valid phone number without +\nExample: .pair 923427582XXX");
        }

        // Fetch all servers from API
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return await reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        // Select random server from the list
        const randomServer = servers[Math.floor(Math.random() * servers.length)];
        const selectedServerId = randomServer.id;
        const selectedServerUrl = randomServer.url;
        
        // Make DIRECT request to the external server's /code endpoint
        const response = await axios.get(`${selectedServerUrl}/code`, {
            params: { 
                number: phoneNumber 
            },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return await reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;
        
        await react('✅');
        
        // Send initial code message
        await reply(`🔐 *JAWAD-MD PAIR CODE*\n\n*${pairingCode}*\n\n*Server:* ${randomServer.name}\n*Server ID:* ${selectedServerId}\n\n📱 *How to use:*\n1. Open WhatsApp on your phone\n2. Go to Linked Devices\n3. Tap on Link Device\n4. Enter this code when prompted\n\n> *© Pᴏᴡᴇʀᴇᴅ Bʏ Jᴀᴡᴀᴅ Tᴇᴄʜ-♡*`);

        // Send clean code only
        await reply(`${pairingCode}`);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        await reply("❌ An error occurred while getting pairing code. Please try again later.");
    }
});
