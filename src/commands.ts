import { GuildMember, TextChannel, User } from "discord.js"
import bot from "./bot"
import config, { LogLevel } from "./config"
import CommandError, { COMMAND_NOT_FOUND, INVALID_ARGUMENT, MISSING_ARG, NOT_AUTHORIZED, REQUIRES_SUBCOMMAND, TO_MANY_ARGS, USER_MISSING } from "./errors/CommandError"
import logger from "./logger"
import { importAllWithName } from "./utils"

type Execute = (channel: TextChannel, by: User, ...args: any[]) => Promise<Response> | Response
export type Response = string | { message: string | string[], level: LogLevel, title?: string }
type Permission = (u: GuildMember) => void | boolean

export const IS_ADMIN: Permission = user => {
   return user.permissions.has('ADMINISTRATOR')
}

export interface Argument {
   name?: string
   type: 'string' | 'number' | 'user'
   optional?: boolean
}

interface CommonCommand {
   execute?: Execute
   description: string
   permission?: Permission
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

function isParent(command: Command): command is ParentCommand {
   return (command as any).subcommands
}

function isExecuter(command: Command): command is ExecuteCommand {
   return !!command.execute
}

const COMMANDS: Record<string, Command> = {}

const parseArgument = (input: string, arg: Argument): Arg | Promise<Arg> => {
   switch (arg.type) {
      case 'number': {
         const i = Number.parseInt(input)
         if (!isNaN(i)) throw new CommandError(INVALID_ARGUMENT(arg))
         return i
      }
      case 'user': {
         const search = input.match(/<@\!?(.+)>/)?.[1] ?? input
         return bot.users.fetch(search).catch(() => {
            throw new CommandError(USER_MISSING(search))
         })
      }
      default: return input
   }
}

export interface FoundCommand { command: ExecuteCommand, args: (Promise<Arg> | Arg | null)[] }
const findCommand = (channel: TextChannel, by: User, input: string, available?: Record<string, Command>): FoundCommand => {
   const [id, ...args] = input.split(' ').map(s => s.trim()).filter(s => s.length)
   const command = Object.entries(available ?? COMMANDS)
      .find(([name]) => name == id)?.[1]

   if (command) {

      if (command.permission) {
         const member = channel.guild.member(by)
         if (!member) throw new Error('Command executer not in guild of channel')
         if (command.permission(member) === false) throw new CommandError(NOT_AUTHORIZED)
      }

      if (!isParent(command) || args.length === 0) {
         const argsSpecs = (command as ExecuteCommand).arguments ?? []
         if(!isExecuter(command)) throw new CommandError(REQUIRES_SUBCOMMAND(id))

         if (args.length > argsSpecs.length) throw new CommandError(TO_MANY_ARGS)

         const parsedArgs = argsSpecs.map((spec, i) => {
            const given = args[i]
            if (given) return parseArgument(given, spec)
            else if (!spec.optional) throw new CommandError(MISSING_ARG(spec))
            return null;
         })

         return { command, args: parsedArgs }

      } else {
         return findCommand(channel, by, args.join(' '), command.subcommands)
      }

   } else throw new CommandError(COMMAND_NOT_FOUND(id), by)
}

const load = async () => {
   const commands = await importAllWithName<Command>('commands')

   logger.debug(`Loaded ${commands.length} commands`)

   commands.forEach(([name, command]) =>
      COMMANDS[name.substring(0, name.lastIndexOf('.'))] = command
   )
}

const find = (user: GuildMember, by: string, commands?: Record<string, Command>): Command | undefined => {
   const findIn = available(user, commands)
   return Object.entries(findIn).find(([name, c]) => name === by)?.[1]
}

const available = (user: GuildMember, commands?: Record<string, Command>): Record<string, Command> => {
   return Object.entries(commands ?? COMMANDS).filter(([, c]) => {
      try {
         return !c.permission || c.permission(user) !== false
      } catch (e) {
         if (e instanceof CommandError) return false
         throw e
      }
   }).map(([name, cmd]) => [name, {
      ...cmd,
      subcommands: isParent(cmd) ? available(user, cmd.subcommands) : undefined
   }] as [string, Command]).reduce((o, [name, c]) => ({ ...o, [name]: c }), {})
}

const parse = (channel: TextChannel, by: User, message: string) => {
   const { prefix } = config.discord

   if (message.startsWith(prefix)) return findCommand(channel, by, message.substring(prefix.length))
   else return null
}

const tryExecute = async (channel: TextChannel, by: User, message: string | FoundCommand) => {

   const found = typeof message === 'string' ? parse(channel, by, message) : message
   if (!found) return null

   const { command, args } = found
   return command.execute(channel, by, ...await Promise.all(args))
}

export default { load, find, tryExecute, available, isParent, parse, isExecuter }