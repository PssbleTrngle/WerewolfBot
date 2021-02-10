import { startBot } from "https://deno.land/x/discordeno/mod.ts";
import config from "./config.ts";
import connection from "./database/connection.ts";
import Game from "./database/models/Game.ts";
import Logger from "./logger.ts";
import { importAll } from "./utils.ts";

await connection()

startBot({
   token: config.discord.token,
   intents: ["GUILDS", "GUILD_MESSAGES"],
   eventHandlers: {
      async ready() {

         await importAll('commands').then(c => c.forEach(fn => fn()))

         Logger.success('Bot started')

      },
      async messageCreate(message) {
         const { content, channel, author } = message
         if(!channel) return;

         if (content === "!start") {            
            await Game.start(author, channel.id)
               .then(r => channel.send(r))
               .catch(e => channel.send('An error occured: ' + e))
         }
      },
   },
});
