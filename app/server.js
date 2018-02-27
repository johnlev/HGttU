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
controller.spawn({
  token: process.env.KEY,
}).startRTM((err) => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// ==========================================================

const SCOPE = ['direct_message', 'direct_mention', 'mention'];

controller.hears(
  ['life, the universe, and everything'],
  SCOPE,
  (bot, message) => {
    bot.reply(message, 'The answer to the question of life, the universe, and everything is 42');
  },
);

controller.hears(
  ['help'],
  SCOPE,
  (bot, message) => {
    fs.readFile('data/hitchhikers_guide_description.txt', 'utf8', (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      let string = `*Don't Panic*. ${data}`;
      string += '\n\nThe following entries are available:\n';

      Object.keys(bookEntries).forEach((key) => {
        string += `\n\t*${key}*: _${bookEntries[key].main.substring(0, 50)}..._`;
      });

      bot.reply(message, string);
    });
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

controller.hears(
  ['more', 'anything else?'],
  SCOPE,
  (bot, message) => {
    Conversation.schema.statics.getLast(bot, message).then((convo) => {
      if (!convo) {
        // Don't remember, but let's see if they mentioned a topic
      }

      const item = bookEntries[convo.topic];
      if (item) {
        if (!item.more || convo.moreIndex >= item.more.length) {
          bot.reply(message, `I don't know anything else about ${convo.topic}.`);
        } else {
          bot.reply(message, item.more[convo.moreIndex] + (convo.moreIndex + 1 >= item.more.length ? '\n\n(end of entry)' : ''));
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
  controller.hears(
    [topic],
    SCOPE,
    (bot, message) => {
      bot.reply(message, bookEntries[topic].main);
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
