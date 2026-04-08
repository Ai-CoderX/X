const { cmd, commands } = require('../command');
const axios = require('axios');

// Your Vercel API base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app';

// Validate emojis format
function validateEmojis(input) {
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]+(?![,])[\p{Emoji}\u200d]+/gu;
    
    if (consecutiveEmojisRegex.test(input)) {
        return {
            valid: false,
            error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .reactpost https://whatsapp.com/channel/ID/123 😂,❤️,🔥,👏,😮'
        };
    }
    
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    if (emojis.length === 0) {
        return {
            valid: false,
            error: '❌ *No valid emojis found!*\n*Example:* .reactpost https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
        };
    }
    
    return {
        valid: true,
        emojis: emojis
    };
}

cmd({
    pattern: "chreact",
    alias: ["channelreact", "react", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post using all servers",
    category: "owner",
    use: ".react <channel_url> <emojis>",
    filename: __filename
}, async (conn, mek, m, { 
    from, quoted, body, isCmd, command, args, q, 
    isGroup, sender, senderNumber, botNumber2, botNumber,
    pushname, isMe, isCreator, isRealOwner, reply, react 
}) => {
    try {
        // Check if user is creator
        if (!isCreator) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Only bot creator can use this command!*");
        }
        
        // Check if URL is provided
        if (!args[0]) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Please provide a channel post URL!*\n\n*Example:*\n.react https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j/5300 😂,❤️,🔥`);
        }
        
        // Send processing reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // Extract URL and emojis
        const url = args[0];
        let emojisInput = args.slice(1).join(' ');
        
        // If no emojis provided, use default
        if (!emojisInput) {
            emojisInput = '❤️,👍,😮,😎,💀';
        }
        
        // Validate emojis
        const validation = validateEmojis(emojisInput);
        if (!validation.valid) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(validation.error);
        }
        
        // Fetch all servers from YOUR API (just to get URLs)
        const serversResponse = await axios.get(`${API_BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        const emojisString = validation.emojis.join(',');
        
        // Send immediate response
        const resultMessage = `*📡 Sending Reactions to ${servers.length} Servers...*

> *© Pᴏᴡᴇʀᴇᴅ Bʏ Jᴀᴡᴀᴅ Tᴇᴄʜ-♡*`;
        
        await reply(resultMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
        // FIRE AND FORGET - Send all requests without waiting
        for (const server of servers) {
            const externalServerUrl = server.url;
            const reactUrl = `${externalServerUrl}/chreact?url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            
            // Fire and forget - no await
            axios.get(reactUrl, { 
                timeout: 5000
            }).catch(() => {});
        }
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});
