import { Command } from "../commands";
import config, { LogLevel } from "../config";
import Player from "../database/models/Player";
import CommandError, { NOT_IN_GAME } from "../errors/CommandError";

const command: Command = {
   description: 'Leave the game you are in',
   execute: async (channel, by) => {
      const player = await Player.createQueryBuilder('player')
         .where(({ discord: by.id }))
         .andWhere('game.channel = :channel', { channel: channel.id })
         .leftJoinAndSelect('player.game', 'game')
         .getOne()

      if (!player) throw new CommandError(NOT_IN_GAME)

      const game = await player.leave()

      if(game) return `<@${by.id}> left the game (${game.players.length}/${config.game.minPlayers})`
      else return { message: `<@${by.id}> left the game, not enough players to continue`, level: LogLevel.WARN }
   }
}

export default command