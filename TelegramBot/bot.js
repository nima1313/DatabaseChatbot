const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config()

// Replace with your token from BotFather
const token = process.env.TELEGRAM_API_KEY;

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

    const typeOfAnswer = response.data.typeOfAnswer;

    // Plot

    if (typeOfAnswer==process.env.WORD_FOR_PLOT){
      const imagePath = response.data.imagePath;

      // Send the image to the user
      bot.sendPhoto(chatId, imagePath, { caption: 'Here is your image!' });
      console.log("Image sent!");
    }

    // Sentence

    else{
       const answer = response.data.asnwerToQuestion;
       bot.sendMessage(chatId, answer);
       console.log("Answer sent");
    }
    
  } catch (error) {
    console.error('Error processing query:', error);
    bot.sendMessage(chatId, 'Failed to process your query.');
  }
});
