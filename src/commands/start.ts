import { Command } from "../commands";
import Game from "../database/models/Game";

const command: Command = {
   description: 'Start the waiting game in this channel',
   execute: async channel => {
      const game = await Game.inChannel(channel.id)

      return game.start()
   }
}

export default command