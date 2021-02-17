import { Command } from "../commands";
import Game, { GameState } from "../database/models/Game";
import CommandError from "../errors/CommandError";

const command: Command = {
   description: 'Start the waiting game in this channel',
   execute: async channel => {
      const game = await Game.inChannel(channel.id)

      if (game.state !== GameState.WAITING) throw new CommandError('Game has already started')

      return game.start()
   }
}

export default command