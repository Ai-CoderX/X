const { cmd, commands } = require('../command');
const axios = require('axios');

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

// API Base URL
const API_BASE_URL = 'https://jawadtechx.vercel.app/api';

cmd({
    pattern: "react",
    alias: ["channelreact", "chreact", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post using all bots",
    category: "owner",
    use: ".reactpost <channel_url> <emojis>",
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
            return reply(`❌ *Please provide a channel post URL!*\n\n*Example:*\n.chreact https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j/5300 😂,❤️,🔥`);
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
        
        // Get random server from API
        const randomServerRes = await axios.get(`${API_BASE_URL}/random`, { timeout: 5000 });
        const server = randomServerRes.data.server;
        
        if (!server) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *No servers available!*");
        }
        
        // React using the server
        const reactResponse = await axios.get(`${API_BASE_URL}/chreact`, {
            params: {
                server: server,
                url: url,
                emojis: validation.emojis.join(',')
            },
            timeout: 30000
        });
        
        if (reactResponse.data && reactResponse.data.success) {
            // Send success reaction
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            
            // Send clean response message
            const resultMessage = `╭━━━〔 *JAWAD-MD* 〕━━━┈⊷
┃▸ *Success!* Reaction sent
┃▸ *Created By :* JawadTech
┃▸ *Reaction:* ${validation.emojis.join(', ')}
╰────────────────┈⊷
> *© Pᴏᴡᴇʀᴇᴅ Bʏ KʜᴀɴX-Aɪ ♡*`;
            
            await reply(resultMessage);
            
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await reply(`❌ *Failed to react!*\n\n*Error:* ${reactResponse.data?.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error reacting to channel post!*\n\n*Error:* ${error.message}`);
    }
});
