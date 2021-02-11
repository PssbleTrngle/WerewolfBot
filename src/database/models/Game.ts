import { User } from 'discord.js';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import config from '../../config';
import CommandError, { ALREADY_JOINED, GAME_EXISTING, GAME_MISSING, START_NOT_ENOUGH_PLAYERS } from '../../errors/CommandError';
import Player from "./Player";

@Entity()
export default class Game extends BaseEntity {

   get started() {
      return false
   }

   @PrimaryGeneratedColumn()
   id!: number

   @Column({ type: 'varchar', unique: true })
   channel!: string

   @OneToMany(() => Player, p => p.game, { eager: true })
   players!: Player[]

   static async inChannel(channel: string) {
      const game = await Game.findOne({ channel })
      if (!game) throw new CommandError(GAME_MISSING)
      else return game
   }

   static async createIn(player: User, channel: string) {
      const existing = await Game.inChannel(channel).catch(() => null)
      if (existing) throw new CommandError(GAME_EXISTING, player)

      const game = await Game.create({ channel }).save()
      await game.join(player)
   }

   async stop() {
      await this.remove()
   }

   async start() {

      if (this.players.length < config.game.minPlayers) throw new CommandError(START_NOT_ENOUGH_PLAYERS)


   }

   async join(discord: User) {
      const player = await Player.create({
         discord: discord.id,
         game: this
      }).save().catch(e => {
         if (e.message.includes('duplicate key')) throw new CommandError(ALREADY_JOINED)
         throw e
      })

      await this.reload()
      return player
   }

}