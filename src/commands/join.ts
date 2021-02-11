import { Command } from "../commands";
import config from "../config";
import Game from "../database/models/Game";
import CommandError from "../errors/CommandError";

const command: Command = {
   description: 'Join the current game in this channel',
   execute: async (channel, by) => {
      const game = await Game.inChannel(channel.id)
      
      if(!game) throw new CommandError('No game has started yet in this channel')
      if(game.players.length >= config.game.maxPlayers) throw new CommandError('This game is already full')

      await game.join(by)
      
      return `<@${by.id}> joined the game (${game.players.length} / ${config.game.minPlayers})`
   }
}

export default command