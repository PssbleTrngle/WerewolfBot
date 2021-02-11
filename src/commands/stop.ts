import { Command, IS_ADMIN } from "../commands";
import { LogLevel } from "../config";
import Game from "../database/models/Game";

const command: Command = {
   description: 'Force the current game to stop',
   permission: IS_ADMIN,
   execute: async channel => {
      const game = await Game.inChannel(channel.id)

      await game.stop();

      return { message: 'The game has been forcefully stopped by an admin', level: LogLevel.WARN }
   }
}

export default command