import { TextChannel, User } from 'discord.js';
import { BaseEntity, Column, Entity, MoreThan, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import bot from '../../bot';
import { Response } from '../../commands';
import config, { LogLevel } from '../../config';
import CommandError, { ALREADY_JOINED, GAME_EXISTING, GAME_MISSING, START_NOT_ENOUGH_PLAYERS } from '../../errors/CommandError';
import logger from '../../logger';
import { ALIVE } from '../../logic/Action';
import Lynch from '../../logic/actions/Lynch';
import Sleeping from '../../logic/actions/Sleeping';
import Role, { Event } from '../../logic/Role';
import Villager from '../../logic/roles/Villager';
import Werewolf from '../../logic/roles/Werewolf';
import { arrayOf, exist, uniqueBy } from '../../utils';
import Death from './Death';
import Player from "./Player";
import Screen from './Screen';

enum State {
   WAITING = 'waiting',
   NIGHT = 'night',
   DAY = 'day',
}

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

   @OneToMany(() => Screen, s => s.game, { eager: true })
   screens!: Screen[]

   @Column({ enum: State, default: State.WAITING })
   state!: State

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

      // A third of the players will be werewolfs
      roles.push(...arrayOf(this.players.length / 3).map(() => Werewolf))

      // All left players will be villagers
      roles.push(...arrayOf(this.players.length - roles.length).map(() => Villager))

      // Shuffle and assign roles
      roles
         //.sort(() => Math.random() - 0.5)
         .forEach((r, i) => this.players.sort((a, b) => a.id - b.id)[i].role = r)

      await this.save()

   }

   /**
    * @return Every role present in the current game
    */
   usedRoles() {
      return this.players
         .map(p => p.role)
         .filter(exist)
         .filter(uniqueBy(r => r.name))
   }

   get alive() {
      return this.players.filter(p => ALIVE(p))
   }

   private async call(event: Event) {
      const roles = this.usedRoles()
      await Promise.all(roles.map(r => r.call(event, this)))
   }

   /**
    * Checks if there are any open screens
    * If not, executes all of them
    */
   async checkScreens() {

      if (this.screens.every(s => s.done)) {

         await this.executeScreens()

         const message = this.state === State.NIGHT ? this.setDay() : this.setNight()
         await bot.embed(this.channel, await message)

      } else {
         logger.debug(`Still ${this.screens.filter(s => !s.done).length} screens open`)
      }

   }

   /**
    * Called before each day/night
    */
   private async nextPhases(phase: State.DAY | State.NIGHT) {
      await this.reload()
      if (this.state === phase) throw new Error('Game already in that phase')
      this.state = phase
      await this.save()

      logger.debug(`Setting ${phase}`)

      // Kill players
      const dying = this.players.filter(p => p.deaths.some(d => d.in === 0))
      await Promise.all(dying.map(async player => {
         const death = player.deaths.find(d => d.in === 0)

         logger.debug(`'${player.name}' died of '${death?.reason}'`)

         player.alive = false
         await player.save()
         await Death.delete({ player })

         const user = await bot.users.fetch(player.discord)
         await bot.embed(user, { title: 'You died!', message: death?.reason })

      }))

      // Decrement open deaths
      await Death.getRepository().decrement({ in: MoreThan(0) }, 'in', 1)

      await this.call(phase)
   }

   /**
    * Sets the game state to night
    *    - Calls `night` event on all roles
    *    - Puts all players on the `sleep` screen
    * 
    * @returns The night message
    */
   async setNight(): Promise<Response> {
      await this.nextPhases(State.NIGHT)

      await Sleeping.screen(this.alive)

      return { title: 'Night has fallen!', level: LogLevel.INFO }
   }

   /**
    * Sets the game state to day
    * 
    * @returns The day message
    */
   async setDay(): Promise<Response> {
      await this.nextPhases(State.DAY)

      await Lynch.screen(this.alive)

      return { title: 'The sun has risen', level: LogLevel.INFO }

   }

   async executeScreens() {

      const sorted = this.screens
         .filter(s => s.done)
         .sort((a, b) => b.action.priority() - a.action.priority())

      // For loop because I need to keep the sorted order
      for (const screen of sorted) {
         logger.debug(`Executing '${screen.action.name}' with result '${screen.result}'`)
         const chosen = await screen.chosen()
         await screen.action.execute(this, chosen)
      }

      await Screen.delete({ done: true, game: this })
   }

   /**
    * @deprecated 
   */
   private async reset() {
      await Screen.delete({})

      await Death.delete({})
      await Player.update({ game: this }, { alive: true })

      const channel = await bot.channels.fetch(this.channel) as TextChannel
      await Promise.all(this.players.map(async p => {
         p.role = null as any
         const member = await channel.guild.members.fetch(p.discord)
         p.name = member.displayName
         p.alive = true
         await p.save()
      }))

      await this.reload()
   }

   async start(): Promise<Response> {

      if (this.players.length < config.game.minPlayers) throw new CommandError(START_NOT_ENOUGH_PLAYERS)

      await this.reset()

      await this.assignRoles()

      await Promise.all(this.players.map(async player => {
         const user = await bot.users.fetch(player.discord)
         bot.embed(user, {
            title: `You are a **${player.role?.name}**`,
            message: 'Role description...'
         })
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