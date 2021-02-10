import { bgWhite, black, blue, green, red, yellow } from 'https://deno.land/std@0.86.0/fmt/colors.ts'

enum Level {
   ERROR,
   WARN,
   SUCCESS,
   INFO,
   DEBUG,
}

class Logger {
   info = (msg: string) => this.log(Level.INFO, msg, blue)
   success = (msg: string) => this.log(Level.SUCCESS, msg, green)
   error = (msg: string) => this.log(Level.ERROR, msg, red)
   warn = (msg: string) => this.log(Level.WARN, msg, yellow)
   debug = (msg: string) => this.log(Level.DEBUG, msg, bgWhite, black)

   log(level: Level, msg: string, ...mods: ((s: string) => string)[]) {
      console.log(
         mods.reduce((s, m) => m(s),
            `[${Level[level]}] ${msg}`
         )
      )
   }
}

export default new Logger()