import commands, { Command } from "../commands";
import { LogLevel } from "../config";

const command: Command = {
   description: 'Help about the game or a specific command',
   execute: async (channel, by) => {
      const member = channel.guild.member(by)
      if (!member) throw new Error('Command executer not in guild')

      const available = commands.available(member)

      const message = Object.keys(available).map(c => `\`${c}\``).join(', ');
      return { level: LogLevel.INFO, message, title: `You can use the following ${Object.keys(available).length} commands` }
   }
}

export default command