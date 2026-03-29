// JawadTech - Update All Servers Command

const { cmd } = require('../command');
const axios = require('axios');

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
        
        // Request update from API
        const API_BASE_URL = 'https://jawadtechx.vercel.app/api';
        const updateResponse = await axios.get(`${API_BASE_URL}/updatex`, {
            params: {
                key: 'jawi804'
            },
            timeout: 60000
        });
        
        if (updateResponse.data && updateResponse.data.success) {
            await react('✅');
            return reply("Updated Successfully");
        } else {
            await react('❌');
            return reply("Update Failed");
        }
        
    } catch (error) {
        console.error("Update error:", error.message);
        await react('❌');
        return reply("Update Failed");
    }
});
