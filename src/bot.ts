import { Channel, Client, DMChannel, NewsChannel, PartialTextBasedChannelFields, TextChannel } from "discord.js";
import commands from './commands';
import config, { LogLevel } from "./config";
import PlayerToScreen from "./database/models/PlayerToScreen";
import CommandError from "./errors/CommandError";
import logger, { LogColor } from "./logger";

export type MsgChannel = TextChannel | DMChannel | NewsChannel

export function isMessageChannel(channel: Channel): channel is MsgChannel {
   return ['text', 'dm', 'news'].includes(channel.type)
}

class Bot extends Client {

   constructor() {
      super({})
   }

   async embed(channel: PartialTextBasedChannelFields, message: string | string[] | Error | undefined, title?: string, level?: LogLevel) {
      const description = typeof message === 'string'
         ? message
         : message instanceof Error
            ? message.message
            : message?.join('\n')

      const defaultLevel = typeof message === 'string' ? LogLevel.INFO : LogLevel.ERROR
      return channel.send({
         embed: {
            description: description?.slice(0, 200), title,
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
   const { deleteCommandTriggers } = config.discord
   if (channel.type === 'text') {

      const response = await bot.tryIn(channel, () => commands.tryExecute(channel, author, content))

      if (response) {

         if (deleteCommandTriggers && message.deletable) {
            message.delete().catch(e => logger.warn(`Could not delete command trigger: ${e.message}`))
         }

         if (typeof response === 'string') bot.embed(channel, response, undefined, LogLevel.SUCCESS)
         else bot.embed(channel, response.message, response.title, response.level)
      }

   } else if (channel.type === 'dm') {



   }

})

bot.on('messageReactionAdd', async (reaction, by) => {

   const screen = await PlayerToScreen.findOne({ message: reaction.message.id })

   if (!by.bot) screen?.react(reaction.emoji, by.id)

})

export default bot;