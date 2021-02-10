import { User } from 'discord.js';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import CommandError from '../../errors/CommandError';
import Player from "./Player";

@Entity()
export default class Game extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @Column({ type: 'varchar', unique: true })
   channel!: string

   @OneToMany(() => Player, p => p.game, { eager: true })
   players!: Player

   static async inChannel(channel: string) {
      return Game.findOne({ channel })
   }

   static async start(player: User, channel: string) {

      const existing = await Game.inChannel(channel)
      if (existing) throw new CommandError('There is alread a game in the current channel', player)

      const game = await Game.create({ channel }).save()

      await game.join(player)

      return `<@${player.id}> started a new game`
   }

   async join(discord: User) {
      return Player.create({
         discord: discord.id,
         game: this
      }).save()
   }

}