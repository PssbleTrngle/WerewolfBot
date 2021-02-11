import bot from "./bot";
import commands from "./commands";
import config from "./config";
import connection from "./database";
import logger from "./logger";

async function run() {

   await Promise.all([
      connection().then(() => logger.success('Database connected')),
      bot.login(config.discord.token).then(() => logger.success('Bot started')),
      commands.load(),
   ])

}

run().catch(e => {
   logger.error('Fatal error on startup:')
   console.error(e)
})