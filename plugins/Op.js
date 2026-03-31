const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "vote",
    alias: ["chvote", "pollvote"],
    react: "🗳️",
    desc: "Vote in channel polls",
    category: "owner",
    use: '.vote <channel-link> <option-number>',
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!isCreator) return reply("❌ Owner only command");
        if (!q) return reply(`Usage:\n${command} https://whatsapp.com/channel/0029Vb7XUq63QxS2vGW4V33a/117 3\n\n*Note:* The option number should be 1, 2, 3, etc. based on poll options`);

        const parts = q.trim().split(' ');
        
        // Extract link and option number
        let link, optionNum;
        
        if (parts.length >= 2) {
            link = parts[0];
            optionNum = parseInt(parts[1]);
        } else {
            return reply("❌ Please provide: channel link and option number\n\nExample: .vote https://whatsapp.com/channel/0029Vb7XUq63QxS2vGW4V33a/117 3");
        }
        
        // Validate link format
        if (!link.includes("whatsapp.com/channel/")) {
            return reply("❌ Invalid channel link format\n\nCorrect format: https://whatsapp.com/channel/CHANNEL_ID/MESSAGE_ID");
        }
        
        // Validate option number
        if (isNaN(optionNum) || optionNum < 1) {
            return reply("❌ Please provide a valid option number (1, 2, 3, etc.)");
        }
        
        // Extract channel ID and message ID from link
        let channelId, messageId;
        
        // Remove trailing slash if exists
        link = link.replace(/\/$/, '');
        
        // Split the link
        const linkParts = link.split('/');
        
        // Find the channel ID (after 'channel/')
        const channelIndex = linkParts.indexOf('channel');
        if (channelIndex !== -1 && linkParts[channelIndex + 1]) {
            channelId = linkParts[channelIndex + 1];
            
            // Check if there's a message ID after channel ID
            if (linkParts[channelIndex + 2]) {
                messageId = linkParts[channelIndex + 2];
            }
        }
        
        // If no message ID found, try alternative parsing
        if (!messageId) {
            // Try to get last part as message ID
            messageId = linkParts[linkParts.length - 1];
        }
        
        if (!channelId) {
            return reply("❌ Could not extract channel ID from link\n\nExample: https://whatsapp.com/channel/0029Vb7XUq63QxS2vGW4V33a/117");
        }
        
        if (!messageId) {
            return reply("❌ Could not extract message ID from link\n\nExample: https://whatsapp.com/channel/0029Vb7XUq63QxS2vGW4V33a/117");
        }
        
        reply(`📡 *Processing vote...*\nChannel ID: ${channelId}\nMessage ID: ${messageId}\nOption: ${optionNum}`);
        
        // Get channel metadata using invite code
        const channelMeta = await conn.newsletterMetadata("invite", channelId);
        if (!channelMeta) {
            return reply("❌ Failed to fetch channel info. Make sure the channel exists and is accessible.");
        }
        
        const channelJid = channelMeta.id; // Format: "120363423712003032@newsletter"
        
        // Fetch messages to get poll details
        reply("🔍 Fetching poll details...");
        const messages = await conn.newsletterFetchMessages(channelJid, 100, 0, 0);
        
        if (!messages || !messages.length) {
            return reply("❌ No messages found in this channel");
        }
        
        // Find the specific poll message by ID
        let pollMessage = null;
        
        // Try to find by exact ID match
        for (const msg of messages) {
            if (msg.key && msg.key.id === messageId) {
                pollMessage = msg;
                break;
            }
        }
        
        // If not found, try to find by message ID in the message structure
        if (!pollMessage) {
            for (const msg of messages) {
                if (msg.message?.pollCreationMessageV3 && 
                    (msg.key?.id === messageId || msg.messageTimestamp === messageId)) {
                    pollMessage = msg;
                    break;
                }
            }
        }
        
        if (!pollMessage || !pollMessage.message?.pollCreationMessageV3) {
            return reply(`❌ Poll message not found!\n\n*Message ID:* ${messageId}\n*Channel:* ${channelMeta.name}\n\nMake sure the message ID is correct and it's a poll message.`);
        }
        
        const pollData = pollMessage.message.pollCreationMessageV3;
        const options = pollData.options || [];
        
        if (optionNum > options.length) {
            return reply(`❌ Invalid option! Available options:\n${options.map((opt, idx) => `${idx + 1}. ${opt.optionName}`).join('\n')}`);
        }
        
        const selectedOption = options[optionNum - 1];
        
        reply(`🗳️ *Voting in poll:* "${pollData.name}"\n📝 *Selected:* ${selectedOption.optionName}\n\nSending vote...`);
        
        // ==== ACTUAL POLL VOTING ====
        try {
            // Construct the poll vote message
            const voteMessage = {
                pollUpdate: {
                    pollCreationMessageKey: {
                        id: messageId,
                        remoteJid: channelJid,
                        fromMe: false,
                        participant: null
                    },
                    vote: {
                        selectedOptions: [optionNum - 1] // 0-based index
                    }
                }
            };
            
            // Send the vote
            await conn.sendMessage(channelJid, voteMessage);
            
            // Wait for vote to register
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Fetch updated poll results
            const updatedMessages = await conn.newsletterFetchMessages(channelJid, 100, 0, 0);
            const updatedPoll = updatedMessages.find(msg => msg.key?.id === messageId);
            const updatedOptions = updatedPoll?.message?.pollCreationMessageV3?.options || options;
            
            // Calculate vote counts
            let totalVotes = 0;
            updatedOptions.forEach(opt => {
                totalVotes += opt.voteCount || 0;
            });
            
            // Create results message
            let resultsMessage = `╭━━━〔 *✅ POLL VOTE SUCCESSFUL* 〕━━━┈⊷\n`;
            resultsMessage += `┃▸ *Channel:* ${channelMeta.name}\n`;
            resultsMessage += `┃▸ *Poll:* ${pollData.name}\n`;
            resultsMessage += `┃▸ *Your Vote:* ${selectedOption.optionName}\n`;
            resultsMessage += `┃\n`;
            resultsMessage += `┃▸ *📊 UPDATED RESULTS:*\n`;
            
            updatedOptions.forEach((opt, idx) => {
                const votes = opt.voteCount || 0;
                const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
                const barLength = Math.floor(percentage / 5);
                const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
                const isYourVote = (idx === optionNum - 1) ? " ✅" : "";
                resultsMessage += `┃\n`;
                resultsMessage += `┃   ${idx + 1}. ${opt.optionName}${isYourVote}\n`;
                resultsMessage += `┃      ${bar} ${percentage}% (${votes} votes)\n`;
            });
            
            resultsMessage += `┃\n`;
            resultsMessage += `┃▸ *Total Votes:* ${totalVotes}\n`;
            resultsMessage += `┃▸ *Message ID:* ${messageId}\n`;
            resultsMessage += `╰────────────────┈⊷\n`;
            resultsMessage += `> *© Pᴏᴡᴇʀᴇᴅ Bʏ KʜᴀɴX-Aɪ ♡*`;
            
            return reply(resultsMessage);
            
        } catch (voteError) {
            console.error('Vote error details:', voteError);
            
            // Check specific error types
            if (voteError.message?.includes('already voted') || voteError.message?.includes('already')) {
                return reply("❌ You have already voted in this poll!\n\n*Note:* Each user can only vote once per poll.");
            } else if (voteError.message?.includes('expired') || voteError.message?.includes('closed')) {
                return reply("❌ This poll has expired or is closed for voting.");
            } else if (voteError.message?.includes('invalid option')) {
                return reply(`❌ Invalid option selected.\n\nAvailable options:\n${options.map((opt, idx) => `${idx + 1}. ${opt.optionName}`).join('\n')}`);
            }
            
            // If voting fails, provide alternative
            return reply(`❌ Failed to vote automatically.\n\n*Error:* ${voteError.message}\n\nPlease vote manually by:\n1. Opening the channel: ${link}\n2. Clicking on the poll message\n3. Selecting option ${optionNum}: ${selectedOption.optionName}`);
        }
        
    } catch (e) {
        console.error('Error in vote command:', e);
        reply(`❎ Error: ${e.message || "Failed to vote in poll"}`);
    }
});
