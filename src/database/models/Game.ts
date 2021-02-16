import { TextChannel, User } from 'discord.js';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import bot from '../../bot';
import { Response } from '../../commands';
import config, { LogLevel } from '../../config';
import CommandError, { ALREADY_JOINED, GAME_EXISTING, GAME_MISSING, START_NOT_ENOUGH_PLAYERS } from '../../errors/CommandError';
import Sleeping from '../../logic/actions/Sleeping';
import Role from '../../logic/Role';
import Villager from '../../logic/roles/Villager';
import Werewolf from '../../logic/roles/Werewolf';
import { arrayOf } from '../../utils';
import Player from "./Player";
import Screen from './Screen';

@Entity()
export default class Game extends BaseEntity {

   get started() {
      return false
   }

   @PrimaryGeneratedColumn()
   id!: number

   @Column({ type: 'varchar', unique: true })
   channel!: string

   @OneToMany(() => Player, p => p.game, { eager: true, cascade: ['update'] })
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

   private async assignRoles() {

      const roles: Role[] = []

      roles.push(...arrayOf(this.players.length / 3).map(() => Werewolf))

      roles.push(...arrayOf(this.players.length - roles.length).map(() => Villager))

      roles/*sort(() => Math.random() - 0.5).*/.forEach((r, i) =>
         this.players[i].role = r
      )

      await this.save()

   }

   async usedRoles() {
      return this.players
         .map(p => p.role)
         .filter((r, i, a) => r && !a.some((r2, i2) => r2?.name === r.name && i < i2))
   }

   private async setNight() {

      const roles = await this.usedRoles()
      await Promise.all(roles.map(r => r?.call('night', this)))

      await Sleeping.screen(this.players)

      await this.save()

      return { title: 'Night has fallen!', message: '', level: LogLevel.INFO }
   }

   /**
    * @deprecated 
   */
   private async reset() {
      await Screen.delete({})

      const channel = await bot.channels.fetch(this.channel) as TextChannel
      await Promise.all(this.players.map(async p => {
         p.role = null as any
         const member = await channel.guild.members.fetch(p.discord)
         p.name = member.displayName
         await p.save()
      }))
   }

   async start(): Promise<Response> {

      if (this.players.length < config.game.minPlayers) throw new CommandError(START_NOT_ENOUGH_PLAYERS)

      await this.reset()

      await this.assignRoles()

      await Promise.all(this.players.map(async player => {
         const user = await bot.users.fetch(player.discord)
         bot.embed(user, undefined, `You are a **${player.role?.name}**`)
      }))

      return this.setNight()
   }

   async join(discord: User) {
      const channel = await bot.channels.fetch(this.channel) as TextChannel
      const member = await channel.guild.members.fetch(discord)

      const player = await Player.create({
         discord: discord.id,
         name: member.displayName,
         game: this,
      }).save().catch(e => {
         if (e.message.includes('duplicate key')) throw new CommandError(ALREADY_JOINED)
         throw e
      })

      await this.reload()
      return player
   }

}