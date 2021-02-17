import { Command, IS_ADMIN } from "../commands";
import Game from "../database/models/Game";

const command: Command = {
   description: 'Restart the waiting game in this channel',
   permission: IS_ADMIN,
   execute: async channel => {
      const game = await Game.inChannel(channel.id)

      const newGame = await game.recreate()
      return newGame.start()
   }
}

export default command