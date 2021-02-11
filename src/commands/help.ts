import commands, { Command } from "../commands";
import config, { LogLevel } from "../config";
import CommandError, { COMMAND_NOT_FOUND } from "../errors/CommandError";

const command: Command = {
   description: 'Help about the game or a specific command',
   execute: async (channel, by, cmdName) => {

      if (cmdName) {
         const member = channel.guild.member(by)
         if (!member) throw new Error('Command executer not in guild')

         const { prefix } = config.discord
         const command = commands.find(member, cmdName)
         if (!command) throw new CommandError(COMMAND_NOT_FOUND(cmdName))

         const args = commands.isParent(command)
            ? ` [ ${Object.keys(command.subcommands).join(' | ')} ]`
            : (command.arguments ?? []).map(c => ` "${c.name ?? c.type}"`).join('')

         const syntax = '```' + [prefix, cmdName, args].join('') + '```'

         const lines = commands.isParent(command)
            ? Object.entries(command.subcommands).map(([name, cmd]) => `**${name}**: ${cmd.description}`)
            : (command.arguments ?? []).map(a => ` **${a.name ?? a.type}**: *${a.type}*${a.optional ? ' (Optional)' : ''}`)

         return { level: LogLevel.INFO, title: command.description, message: [syntax, ...lines] }
      }

      return { level: LogLevel.INFO, message: 'Help' }
   },
   arguments: [{
      name: 'command',
      type: 'string',
      optional: true,
   }]
}

export default command