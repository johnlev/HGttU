/*
Server.js, an example slackbot designed for use with the DALI Lab.
Last modified by Abby Starr on 7/13/16
*/
import botkit from 'botkit';

console.log('Heeeeere we go....');

const SLACKBOT_TOKEN = 'Put your token here!';

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: SLACKBOT_TOKEN,
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// Hello response-- when you say hello, the bot responds
controller.hears(['hello', 'hi', 'hey', 'heyo', 'hola'],
['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
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
