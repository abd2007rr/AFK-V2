const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const config = require('./settings.json');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot has arrived');
});
app.listen(8000, () => {
  console.log('Server started');
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account']['username'],
    password: config['bot-account']['password'],
    auth: config['bot-account']['type'],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  bot.loadPlugin(pathfinder);
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);

  function tryOpenDoor() {
    const block = bot.blockAt(bot.entity.position.offset(0, 0, 1));
    if (block && block.name.includes('door')) {
      bot.activateBlock(block);
    }
  }

  function randomMovement() {
    const directions = ['forward', 'back', 'left', 'right'];
    const dir = directions[Math.floor(Math.random() * directions.length)];

    bot.clearControlStates();
    bot.setControlState(dir, true);

    const sprint = Math.random() < 0.4;
    bot.setControlState('sprint', sprint);

    bot.look(Math.random() * Math.PI * 2, Math.random() * 0.5 - 0.25, true);

    if (Math.random() < 0.3) tryOpenDoor();

    setTimeout(randomMovement, 2000 + Math.random() * 4000);
  }

  function randomChat() {
    if (!config.utils['chat-messages'].enabled) return;
    const messages = config.utils['chat-messages']['messages'];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    bot.chat(msg);
    setTimeout(randomChat, 5000 + Math.random() * 15000);
  }

  bot.once('spawn', () => {
    console.log('[AfkBot] Bot joined the server');

    if (config.utils['auto-auth'].enabled) {
      const password = config.utils['auto-auth'].password;
      bot.chat(`/login ${password}`);
    }

    if (config.utils['chat-messages'].enabled) {
      randomChat();
    }

    if (config.utils['anti-afk'].enabled) {
      randomMovement();
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`[AfkBot] Bot was kicked from the server. Reason: ${reason}`);
  });

  bot.on('error', (err) => {
    console.log(`[ERROR] ${err.message}`);
  });

  if (config.utils['auto-reconnect']) {
    bot.on('end', () => {
      setTimeout(() => {
        createBot();
      }, config.utils['auto-recconect-delay']);
    });
  }
}

createBot();
