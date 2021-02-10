import { Client, DMChannel, NewsChannel, TextChannel } from "discord.js";
import Game from "./database/models/Game";
import CommandError from "./errors/CommandError";
import logger from "./logger";

const bot = new Client({

})

async function tryIn<T>(channel: TextChannel | DMChannel | NewsChannel, fn: () => string | Promise<string>) {
   try {
      const response = await fn()
      channel.send(response)
   } catch (e) {
      if (e instanceof CommandError) channel.send(e.message)
      else {
         channel.send('An error occured')
         logger.error(e)
      }
   }
}

bot.on('message', async message => {
   const { content, channel, author } = message
   if (!channel) return;

   if (content === "!start") {
      tryIn(channel, () => Game.start(author, channel.id))
   }
})

export default bot;