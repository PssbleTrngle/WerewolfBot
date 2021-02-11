import bot from "../bot";
import { Command } from "../commands";

const command: Command = {
   description: 'Invite this bot to your own server',
   execute: () => {
      return `https://discord.com/api/oauth2/authorize?client_id=${bot.user?.id}&permissions=0&scope=bot%20applications.commands`
   }
}

export default command