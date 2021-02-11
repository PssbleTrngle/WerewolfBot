import { Command } from "../commands";
import config from "../config";
import Game from "../database/models/Game";
import CommandError, { GAME_FULL } from "../errors/CommandError";
import force from './fjoin';

const command: Command = {
   description: 'Join the current game in this channel',
   execute: async (channel, by) => {
      const game = await Game.inChannel(channel.id)

      if (game.players.length >= config.game.maxPlayers) throw new CommandError(GAME_FULL)

      await game.join(by)

      return `<@${by.id}> joined the game (${game.players.length}/${config.game.minPlayers})`
   },
   subcommands: {
      force
   }
}

export default command