import { User } from "discord.js";
import { Command, IS_ADMIN } from "../commands";
import config from "../config";
import Game from "../database/models/Game";

const command: Command = {
   description: 'Force a player to join the current game in this channel',
   permission: IS_ADMIN,
   execute: async (channel, _, user: User) => {
      const game = await Game.inChannel(channel.id)

      await game.join(user)

      return `<@${user.id}> was forced to joined the game (${game.players.length}/${config.game.minPlayers})`
   },
   arguments: [{
      type: 'user',
   }]
}

export default command