import { Command } from "../commands";
import config from "../config";
import Game from "../database/models/Game";
import CommandError, { MAX_GAMES } from "../errors/CommandError";

const command: Command = {
   description: 'Start a new game of werewolf',
   execute: async (channel, by) => {

      if(await Game.count() >= config.game.maxGames) throw new CommandError(MAX_GAMES)

      await Game.createIn(by, channel.id)

      return `<@${by.id}> started a new game (1/${config.game.minPlayers})`
   }
}

export default command