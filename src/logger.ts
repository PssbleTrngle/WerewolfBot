import { bgWhite, black, blue, green, red, yellow } from 'chalk'
import bot from './bot'
import config, { LogLevel } from './config'

type Mods = ((s: string) => string)[]
type MSG = string | number | Error

export const LogColor = {
   [LogLevel.ERROR]: 0xE5433D,
   [LogLevel.WARN]: 0xFFCC33,
   [LogLevel.SUCCESS]: 0x4CE65B,
   [LogLevel.INFO]: 0x4CC7E6,
   [LogLevel.DEBUG]: 0x4CC7E6,
}

class Logger {

   info = (msg: MSG) => this.log(LogLevel.INFO, msg, blue)
   success = (msg: MSG) => this.log(LogLevel.SUCCESS, msg, green)
   error = (msg: MSG) => this.log(LogLevel.ERROR, msg, red)
   warn = (msg: MSG) => this.log(LogLevel.WARN, msg, yellow)
   debug = (msg: MSG) => this.log(LogLevel.DEBUG, msg, bgWhite, black)

   async log(level: LogLevel, msg: MSG, ...mods: Mods) {
      this.logConsole(level, msg, ...mods)
      await this.logChannel(level, msg).catch(() => { })
   }

   private logConsole(l: LogLevel, msg: MSG, ...mods: Mods) {
      if (l <= config.logger.console.level) {
         console.log(
            mods.reduce((s, m) => m(s),
               `[${LogLevel[l]}] ${msg}`
            )
         )
         if (msg instanceof Error && process.env.NODE_ENV !== 'production') console.log(msg.stack)
      }
   }

   private async logChannel(l: LogLevel, msg: MSG) {
      const { id, level } = config.logger.channel
      const channel = id ? await bot.channels.fetch(id) : null

      if (channel?.isText() && l <= level) {
         if (msg instanceof Error) bot.embed(channel, { title: msg.message, message: '```typescript\n' + msg.stack + '\n```', level: l })
         else channel.send(msg.toString())
      }
   }

}

export default new Logger()