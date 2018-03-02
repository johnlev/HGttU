/*
Server.js, an example slackbot designed for use with the DALI Lab.
Based heavily off of Howdy's Botkit and Tim Tregubov's bot user code
Last modified by Abby Starr on 7/13/16
*/
import botkit from 'botkit';
import mongoose from 'mongoose';
import { Conversation } from './models';

const bookEntries = require('../data/book_entries.json');
require('dotenv').config();
const fs = require('fs');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/api';
mongoose.connect(mongoURI);
// set mongoose promises to es6 default
mongoose.Promise = global.Promise;

console.log('Heeeeere we go....');

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot (taken from Tim Tregubov)
JSON.parse(process.env.KEYS).forEach((key) => {
  controller.spawn({
    token: key,
  }).startRTM((err) => {
    // start the real time message client
    if (err) { throw new Error(err); }
  });
});

// ==========================================================

const SCOPE = ['direct_message', 'direct_mention', 'mention'];

controller.hears(
  ['more', 'anything else?', 'entry?', 'entries?'],
  SCOPE,
  (bot, message) => {
    Conversation.schema.statics.getLast(bot, message).then((convo) => {
      let handled = false;
      Object.keys(bookEntries).forEach((key) => {
        if (message.text.toLowerCase().includes(key.toLowerCase())) {
          if (convo && convo.topic == key) {
            return;
          }

          bot.reply(message, bookEntries[key].main + (bookEntries[key].more.length == 1 ? '\n\n(end of entry)' : `\n\n(entry 1/${bookEntries[key].more.length + 1})`));
          Conversation.schema.statics.makeNew(bot, message, key, null);
          handled = true;
        }
      });
      if (handled) {
        return;
      }

      const item = bookEntries[convo.topic];
      if (item) {
        if (!item.more || convo.moreIndex >= item.more.length) {
          bot.reply(message, `I don't know anything else about ${convo.topic}.`);
        } else {
          bot.reply(message, item.more[convo.moreIndex] + (convo.moreIndex + 1 >= item.more.length ? '\n\n(end of entry)' : `\n\n(entry ${convo.moreIndex + 2}/${item.more.length + 1})`));
          convo.moreIndex += 1;
          convo.save();
        }
      } else {
        bot.reply(message, `We were talking about ${convo.topic}, but I don't remember anything about it any more!`);
      }
    }).catch((error) => {
      console.log(error);
      bot.reply(message, 'I cannot remember what we were talking about... Oops');
    });
  },
);

Object.keys(bookEntries).forEach((topic) => {
  const list = bookEntries[topic].alias || [];
  list.push(topic);
  controller.hears(
    list,
    SCOPE,
    (bot, message) => {
      bot.reply(message, bookEntries[topic].main + ('more' in bookEntries[topic] ? `\n\n(entry 1/${bookEntries[topic].more.length + 1})` : ''));
      Conversation.schema.statics.makeNew(bot, message, topic);
    },
  );
});

controller.hears(
  ['yes', 'sure', 'of course'],
  SCOPE,
  (bot, message) => {
    Conversation.schema.statics.getLast(bot, message).then((convo) => {
      if (!convo || !convo.lastPrompt) {
        bot.reply(message, 'I\'m glad you have such a positive outlook on things. You will annoy Marvin if you keep it up though');
      } else if (convo.lastPrompt == 'random') {
        const keys = Object.keys(bookEntries);
        const key = keys[Math.floor(Math.abs(keys.length * Math.random()))];
        bot.reply(message, `Let me tell you about ${key}:`);
        bot.reply(message, bookEntries[key].main);
        Conversation.schema.statics.makeNew(bot, message, key, null);
      }
    });
  },
);

controller.hears(
  ['tell me about', 'know about'],
  SCOPE,
  (bot, message) => {
    bot.reply(message, 'I don\'t think I know anything about that. Want to know something random?');
    Conversation.schema.statics.makeNew(bot, message, null, 'random');
  },
);

const generateEntries = () => {
  let string = '\n\nThe following entries are available:\n';

  Object.keys(bookEntries).sort((a, b) => {
    return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
  }).forEach((key) => {
    string += `\n\t*${key}*: _${bookEntries[key].main.substring(0, 50)}..._`;
  });

  return string;
};

controller.hears(
  ['help'],
  SCOPE,
  (bot, message) => {
    fs.readFile('data/hitchhikers_guide_description.txt', 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return;
      }

      bot.reply(message, generateEntries());
    });
  },
);

controller.hears(
  ['index', 'list of entries'],
  SCOPE,
  (bot, message) => {
    bot.reply(message, generateEntries());
  },
);

// Hello response-- when you say hello, the bot responds
// taken from Tim Tregubov)
controller.hears(
  ['hello', 'hi', 'hey', 'heyo', 'hola'],
  SCOPE,
  (bot, message) => {
    bot.api.users.info({ user: message.user }, (err, res) => {
      if (res) {
        bot.reply(message, `Hello, ${res.user.name}! Don't panic`);
      } else {
        bot.reply(message, 'Hello there! Don\'t panic');
      }
    });
  },
);
