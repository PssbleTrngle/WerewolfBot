import bot from "./bot";
import config from "./config";
import connection from "./database";
import logger from "./logger";

async function run() {

   await connection()

   await bot.login(config.discord.token)
   logger.success('Bot started')

}

run().catch(e => {
   logger.error('Fatal error on startup:')
   console.error(e)
})