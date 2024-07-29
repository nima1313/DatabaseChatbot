const TelegramBot = require('node-telegram-bot-api');
const sensitiveData = require('./sensitiveData.json');
const axios = require('axios');

// Replace with your token from BotFather
const token = sensitiveData['Telegram-API-key'];

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async(msg) => {
  console.log("This is message : ", msg);
  const chatId = msg.chat.id;
  const messageText = msg.text;


  try {
    const response = await axios.post('http://localhost:3001/process-data', {
      query: messageText
    });

    const imagePath = response.data.imagePath;
    console.log(imagePath);
    // Send the image to the user
    bot.sendPhoto(chatId, imagePath, { caption: 'Here is your image!' });
    console.log("Image sent!")
  } catch (error) {
    console.error('Error processing query:', error);
    bot.sendMessage(chatId, 'Failed to process your query.');
  }
});
