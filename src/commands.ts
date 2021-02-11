import { Channel, User } from "discord.js"
import bot from "./bot"
import config, { LogLevel } from "./config"
import CommandError from "./errors/CommandError"
import logger from "./logger"
import { importAllWithName } from "./utils"

type Execute = (channel: Channel, by: User, ...args: any[]) => Promise<Response> | Response
type Response = string | { message: string, level: LogLevel }

interface Argument {
   name: string
   type: 'string' | 'number' | 'user'
}

interface CommonCommand {
   description: string
}

interface ExecuteCommand extends CommonCommand {
   execute: Execute
   arguments?: Argument[]
}

interface ParentCommand extends CommonCommand {
   subcommands: Record<string, Command>
}

type Arg = string | number | User
export type Command = ExecuteCommand | ParentCommand

function isExecuter(command: Command): command is ExecuteCommand {
   return (command as any).execute
}

const COMMANDS: Record<string, Command> = {}

const parseArgument = (input: string, arg: Argument): Arg | Promise<Arg> => {
   switch (arg.type) {
      case 'number': {
         const i = Number.parseInt(input)
         if (!isNaN(i)) throw new CommandError(`Invalid argument for \`${arg.name}\``)
         return i
      }
      case 'user': {
         return bot.users.fetch(input)
            .catch(() => input)
      }
      default: return input
   }
}

const findCommand = (by: User, input: string, available?: Record<string, Command>): { command: ExecuteCommand, args: (Promise<Arg> | Arg)[] } => {
   const [id, ...args] = input.split(' ').map(s => s.trim()).filter(s => s.length)
   const command = Object.entries(available ?? COMMANDS)
      .find(([name]) => name == id)?.[1]

   if (command) {

      if (isExecuter(command)) {

         const parsedArgs = args.map((arg, i) => parseArgument(arg, (command.arguments ?? [])[i]))
         return { command, args: parsedArgs }

      } else {
         return findCommand(by, args.join(' '), command.subcommands)
      }

   } else throw new CommandError(`Command \`${id}\` not found`, by)
}

const load = async () => {
   const commands = await importAllWithName<Command>('commands')

   logger.debug(`Loaded ${commands.length} commands`)

   commands.forEach(([name, command]) =>
      COMMANDS[name.substring(0, name.lastIndexOf('.'))] = command
   )
}

const all = () => ({ ...COMMANDS })

const tryExecute = async (channel: Channel, by: User, message: string) => {
   const { prefix } = config.discord

   if (message.startsWith(prefix)) {
      const { command, args } = findCommand(by, message.substring(prefix.length))
      return command.execute(channel, by, ...await Promise.all(args))
   }

   return false
}

export default { load, all, tryExecute }