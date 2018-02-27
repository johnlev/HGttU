import mongoose, { Schema } from 'mongoose';
import moment from 'moment';

const conversationSchema = new Schema({
  date: Date,
  channel: String,
  dm: Boolean,
  user: String,
  active: { type: Boolean, default: true },
  topic: String,
  chatlog: [String],
  lastPrompt: String,
  moreIndex: { type: Number, default: 0 },
});

const Conversation = mongoose.model('Conversation', conversationSchema);

conversationSchema.statics.makeNew = function makeNew(bot, message, topic, prompt) {
  const newConvo = new Conversation({
    date: moment(),
    channel: message.channel,
    dm: message.channel[0] === 'D',
    user: message.user,
    topic,
    lastPrompt: prompt,
    chatlog: [message.text],
  });
  return newConvo.save();
};

conversationSchema.statics.getLast = function getLast(bot, message) {
  return Conversation.findOne({
    user: message.user,
    channel: message.channel,
  }, {}, {
    sort: { date: -1 },
  });
};

const parseTopic = function parseTopic(message) {
  return message.text.substring(message.match.index + 13, message.text.length)
    .replace('a ', '')
    .replace('the', '')
    .replace('that', '')
    .trim();
};

module.exports = { Conversation, parseTopic };
