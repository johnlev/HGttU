/*
Server.js, an example slackbot designed for use with the DALI Lab.
Based heavily off of Howdy's Botkit and Tim Tregubov's bot user code
Last modified by Abby Starr on 7/13/16
*/
import botkit from 'botkit';
require('dotenv').config();
const book_entries = require('../data/book_entries.json');

console.log('Heeeeere we go....');

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot (taken from Tim Tregubov)
controller.spawn({
  token: process.env.KEY,
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// Hello response-- when you say hello, the bot responds
// taken from Tim Tregubov)
controller.hears(['hello', 'hi', 'hey', 'heyo', 'hola'],
['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}! Don't panic`);
    } else {
      bot.reply(message, 'Hello there! Don\'t panic');
    }
  });
});

controller.hears(['tell me about'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  let topic = message.text.toLowerCase().replace('tell me about', '').replace('a ', '').replace('the', '').replace('that', '');
  topic = topic.trim();
  if (book_entries[topic]) {
    bot.reply(message, book_entries[topic].main);
  }else{
    let found = false;
    Object.keys(book_entries).forEach((key) => {
      if (key.includes(topic) || topic.includes(key)) {
        bot.reply(message, book_entries[key].main);
        found = true;
      }
    });
    if (!found) {
      bot.reply(message, `I don't have any information about ${message.text.substring(message.match.index + 13, message.text.length).trim()}`);
    }
  }
});

// another response -- type 'sing me a song', see what bot says!
controller.hears(['sing me a song'],
['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message,
  'The itsy bitsy spider went up the water spout.... _(the bot continues to sing.)_');
});

// example of a non-message event: use of Slack API and RTM API to send messages
// adda  reaction to any of your messages! :)
controller.on(['reaction_added'], (bot, message) => {
  console.log(message);
  bot.api.chat.postMessage({ channel: 'D1RDKN5V0',
  text: 'I like emojis too! :metal: :dali_princess: :snail: :unicorn_face: ' });
});
