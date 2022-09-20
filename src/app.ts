import { DiscordBot } from './discord-bot';

require('dotenv').config();

(async () => {
  const bot = DiscordBot.getInstance();

  await bot.initializeClient();

  bot.connect();
})();
