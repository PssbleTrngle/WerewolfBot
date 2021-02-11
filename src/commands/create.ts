import { Command } from "../commands";
import config from "../config";
import Game from "../database/models/Game";
import CommandError from "../errors/CommandError";

const command: Command = {
   description: 'Start a new game of werewolf',
   execute: async (channel, by) => {

      if(await Game.count() >= config.game.maxGames) throw new CommandError('The maximum amount of games has been reached')

      await Game.start(by, channel.id)

      return `<@${by.id}> started a new game`
   }
}

export default command