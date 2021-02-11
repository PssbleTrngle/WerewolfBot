import { Channel, Client, DMChannel, NewsChannel, TextChannel } from "discord.js";
import commands from './commands';
import config, { LogLevel } from "./config";
import CommandError from "./errors/CommandError";
import logger, { LogColor } from "./logger";

type MsgChannel = TextChannel | DMChannel | NewsChannel

export function isMessageChannel(channel: Channel): channel is MsgChannel {
   return ['text', 'dm', 'news'].includes(channel.type)
}

class Bot extends Client {

   constructor() {
      super({})
   }

   embed(channel: MsgChannel, message: string | Error, title?: string, level?: LogLevel) {
      const description = typeof message === 'string' ? message : message.message
      const defaultLevel = typeof message === 'string' ? LogLevel.INFO : LogLevel.ERROR
      channel.send({
         embed: {
            description, title,
            color: LogColor[level ?? defaultLevel],
         }
      })
   }

   async tryIn<T>(channel: MsgChannel, fn: () => T | Promise<T>): Promise<T | false> {
      try {
         return await fn()
      } catch (e) {
         if (e instanceof CommandError) this.embed(channel, e)
         else {
            this.embed(channel, new Error('An error occured'))
            logger.error(e)
         }
         return false;
      }
   }

}

const bot = new Bot()

bot.on('message', async message => {
   const { content, channel, author } = message
   if (!channel) return;

   const response = await bot.tryIn(channel, () => commands.tryExecute(channel, author, content))
   if (response) {
      
      if (config.discord.deleteCommandTriggers && message.deletable) {
         message.delete().catch(e => logger.warn(`Could not delete command trigger: ${e.message}`))
      } 

      if(typeof response === 'string') bot.embed(channel, response, undefined, LogLevel.SUCCESS)
      else bot.embed(channel, response.message, undefined, response.level)
   }

})

export default bot;