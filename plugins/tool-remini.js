// Jawad Tech
const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { cmd } = require("../command");

/**
 * Enhance image using ihancer API (same as working bot)
 */
async function ihancer(buffer, { method = 1, size = "high" } = {}) {
  const availableSizes = ["low", "medium", "high"];

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Image buffer is required");
  }

  if (method < 1 || method > 4) {
    throw new Error("Available methods: 1, 2, 3, 4");
  }

  if (!availableSizes.includes(size)) {
    throw new Error(`Available sizes: ${availableSizes.join(", ")}`);
  }

  const form = new FormData();
  form.append("method", method.toString());
  form.append("is_pro_version", "false");
  form.append("is_enhancing_more", "false");
  form.append("max_image_size", size);
  form.append("file", buffer, `${Date.now()}.jpg`);

  const response = await axios.post(
    "https://ihancer.com/api/enhance",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "accept-encoding": "gzip",
        host: "ihancer.com",
        "user-agent": "Dart/3.5 (dart:io)",
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(response.data);
}

cmd({
  pattern: "remini",
  alias: ["enhance", "hd", "upscale"],
  react: '✨',
  desc: "Enhance photo quality using AI",
  category: "utility",
  use: ".remini [reply to image]",
  filename: __filename
}, async (client, message, { reply, quoted }) => {
  try {
    // Check if quoted message exists and has media
    const quotedMsg = quoted || message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      return reply("📸 Please reply to an image file (JPEG/PNG)\n\nExample: Reply to an image with .remini");
    }

    // Check for supported formats
    if (!/image\/(jpe?g|png)/.test(mimeType)) {
      return reply(`❌ Unsupported file type: ${mimeType}\nOnly JPG and PNG images are supported.`);
    }

    // Send initial reaction
    await client.sendMessage(message.chat, { react: { text: "⏳", key: message.key } });
    
    // Download the media
    const mediaBuffer = await quotedMsg.download();
    
    // Send processing message
    await reply("🔄 *Enhancing image quality...*\n⏱️ This may take a few moments");

    try {
      // Enhance image using ihancer API
      // You can adjust method (1-4) and size (low/medium/high) as needed
      const enhancedBuffer = await ihancer(mediaBuffer, { 
        method: 1,  // Try different methods: 1,2,3,4 for different enhancement styles
        size: "high" // Use high for best quality
      });

      // Send the enhanced image
      await client.sendMessage(message.chat, {
        image: enhancedBuffer,
        caption: "✨ *Image Enhanced Successfully!*\n\n_Quality improved using AI_",
      }, { quoted: message });

      // Send success reaction
      await client.sendMessage(message.chat, { react: { text: "✅", key: message.key } });

    } catch (enhanceError) {
      console.error('Enhancement API Error:', enhanceError);
      
      // Try with different method as fallback
      try {
        const fallbackBuffer = await ihancer(mediaBuffer, { 
          method: 2, 
          size: "medium" 
        });
        
        await client.sendMessage(message.chat, {
          image: fallbackBuffer,
          caption: "✨ *Image Enhanced Successfully!* (Fallback method)",
        }, { quoted: message });
        
        await client.sendMessage(message.chat, { react: { text: "✅", key: message.key } });
      } catch (fallbackError) {
        throw new Error("All enhancement methods failed. Please try again later.");
      }
    }

  } catch (error) {
    console.error('Image Enhancement Error:', error);
    await client.sendMessage(message.chat, { react: { text: "❌", key: message.key } });
    await reply(`❌ *Error:* ${error.message || "Failed to enhance image. The image might be too large or the API is unavailable."}`);
  }
});
