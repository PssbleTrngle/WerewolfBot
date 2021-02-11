import { User } from 'discord.js';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import CommandError from '../../errors/CommandError';
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

   static inChannel(channel: string) {
      return Game.findOne({ channel })
   }

   static async start(player: User, channel: string) {
      const existing = await Game.inChannel(channel)
      if (existing) throw new CommandError('There is alread a game in the current channel', player)

      const game = await Game.create({ channel }).save()
      await game.join(player)
   }

   async join(discord: User) {
      const player = await Player.create({
         discord: discord.id,
         game: this
      }).save().catch(e => {
         if(e.message.includes('duplicate key')) throw new CommandError('You already joined the game')
         throw e
      })

      await this.reload()
      return player
   }

}