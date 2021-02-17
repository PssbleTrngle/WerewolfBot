import { Channel, Client, DMChannel, NewsChannel, PartialTextBasedChannelFields, TextChannel } from "discord.js";
import commands, { ExtendedMessage, Response } from './commands';
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

   private toMessage(message: Response): ExtendedMessage {
      if (typeof message === 'string') return { message: message }
      else if (message instanceof Error) return { message: message.message, level: LogLevel.ERROR }
      else return message
   }

   async embed(channel: PartialTextBasedChannelFields | string, message: Response) {
      const { title, level, embed, message: description } = this.toMessage(message)
      const desc = Array.isArray(description) ? description.join('\n') : description

      const c = typeof channel === 'object' ? channel : await this.channels.fetch(channel) as TextChannel
      return c.send({
         embed: {
            description: desc,
            title: title?.slice(0, 256),
            color: LogColor[level ?? LogLevel.SUCCESS],
            ...embed,
         }
      })
   }

   async tryIn<T>(channel: PartialTextBasedChannelFields, fn: () => T | Promise<T>): Promise<T | false> {
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

         bot.embed(channel, response)
      }

   } else if (channel.type === 'dm') {



   }

})

bot.on('messageReactionAdd', async (reaction, by) => {

   bot.tryIn(by, async () => {

      const screen = await PlayerToScreen.findOne({ message: reaction.message.id })

      if (!by.bot && screen) await screen.react(reaction.emoji, by)

   })

})

export default bot;