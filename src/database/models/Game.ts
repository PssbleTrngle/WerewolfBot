import { TextChannel, User } from 'discord.js';
import { BaseEntity, Column, Entity, MoreThan, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import bot from '../../bot';
import { Response } from '../../commands';
import config, { LogLevel } from '../../config';
import CommandError, { ALREADY_JOINED, GAME_EXISTING, GAME_MISSING, START_NOT_ENOUGH_PLAYERS } from '../../errors/CommandError';
import logger from '../../logger';
import { ALIVE, Event, Events } from '../../logic';
import Lynch from '../../logic/actions/Lynch';
import Sleeping from '../../logic/actions/Sleeping';
import Role from '../../logic/Role';
import Jester from '../../logic/roles/Jester';
import Villager from '../../logic/roles/Villager';
import Werewolf from '../../logic/roles/Werewolf';
import WinCondition from '../../logic/WinCondition';
import { arrayOf, exist, uniqueBy } from '../../utils';
import Death from './Death';
import Player from "./Player";
import Screen from './Screen';
import Win from './Win';

export enum GameState {
   WAITING = 'waiting',
   NIGHT = 'night',
   DAY = 'day',
}

const Phases = {
   [GameState.NIGHT]: {
      action: Sleeping,
      title: 'Night has fallen!',
      gif: 'https://media1.tenor.com/images/3a61a5b84cdb7e4f257a01ce3b151f85/tenor.gif',
   },
   [GameState.DAY]: {
      action: Lynch,
      title: 'The sun has risen!',
      gif: 'https://media.tenor.com/images/9ea722f9eac530c2e9265cf247d09021/tenor.gif',
   }
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

   @Column({ enum: GameState, default: GameState.WAITING })
   state!: GameState

   @OneToMany(() => Win, w => w.game, { eager: true })
   wins!: Win[]

   static async inChannel(channel: string) {
      const game = await Game.findOne({ channel })
      if (!game) throw new CommandError(GAME_MISSING)
      else return game
   }

   static async createIn(channel: string, player?: User) {
      const existing = await Game.inChannel(channel).catch(() => null)
      if (existing) throw new CommandError(GAME_EXISTING, player)

      const game = await Game.create({ channel }).save()
      if (player) await game.join(player)
      return game
   }

   async stop() {
      await this.remove()
   }

   private async assignRoles() {

      const roles: Role[] = []

      // A third of the players will be werewolfs
      roles.push(...arrayOf(this.players.length / 3).map(() => Werewolf))

      roles.push(Jester)

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

   private async call<E extends Event>(event: E, sub?: Events[E]) {
      const roles = this.usedRoles()
      await Promise.all(roles.map(r => r.call(event, this, sub)))
   }

   /**
    * Checks if there are any open screens
    * If not, executes all of them
    */
   async checkScreens() {

      if (this.screens.every(s => s.done)) {

         await this.executeScreens()

         const message = this.state === GameState.NIGHT ? this.setDay() : this.setNight()
         await bot.embed(this.channel, await message)

      } else {
         logger.debug(`Still ${this.screens.filter(s => !s.done).length} screens open`)
      }

   }

   /**
    * Called before each day/night
    */
   private async nextPhases(phase: GameState.DAY | GameState.NIGHT) {
      await this.reload()
      if (this.state === phase) throw new Error('Game already in that phase')
      this.state = phase
      await this.save()

      logger.debug(`Setting ${phase}`)

      // Kill players
      const died = await this.acceptDeath()
      await this.reload()

      await this.call(phase)
      await this.call('phase', phase)

      await this.reload()
      const winMessage = await this.checkWin()
      if (winMessage) return winMessage

      const message: string[] = []

      if (died.length > 0) message.push(
         `**${died.length}** player${died.length === 1 ? '' : 's'} died:`,
         died.map(p => `<@${p.discord}>`).join(' ')
      )

      const { action, title, gif } = Phases[phase]
      action.screen(this.alive)

      return {
         title, message, level: LogLevel.INFO, embed: {
            image: {
               url: gif,
               height: 200,
               width: 300,
            }
         }
      }
   }

   async acceptDeath() {
      const died = this.players.filter(p => p.deaths.some(d => d.in === 0))
      await Promise.all(died.map(async player => {
         const death = player.deaths.find(d => d.in === 0)

         logger.debug(`'${player.name}' died of '${death!.cause}'`)

         player.alive = false
         await player.save()
         await Death.delete({ player })

         const user = await bot.users.fetch(player.discord)
         await bot.embed(user, { title: 'You died!', message: death!.cause })

         await this.call('death', death!.cause)

      }))

      // Decrement open deaths
      await Death.getRepository().decrement({ in: MoreThan(0) }, 'in', 1)
      return died
   }

   async checkWin() {
      const winning = this.wins.sort((a, b) => b.condition.priotity - a.condition.priotity)[0]
      if (winning) {

         const origin = this.players.find(p => p.id === winning.playerId)
         const winners = winning.condition.winners(origin, this.players)

         return {
            title: winning.condition.message,
            message: winners.map(w => `<@${w.discord}> ${w.icon}`).join(' ')
         }

      }
   }

   /**
    * Sets the game state to night
    *  - Calls `night` event on all roles
    *  - Puts all players on the `sleep` screen
    * 
    * @returns The night message
    */
   async setNight(): Promise<Response> {
      return this.nextPhases(GameState.NIGHT)
   }

   /**
    * Sets the game state to day
    * 
    * @returns The day message
    */
   async setDay(): Promise<Response> {
      return this.nextPhases(GameState.DAY)
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

   async recreate() {
      const { channel, players } = this
      await this.stop()
      const newGame = await Game.createIn(this.channel)
      await Promise.all(players.map(async p => {
         const user = await bot.users.fetch(p.discord)
         await newGame.join(user)
      }))

      return newGame
   }

   async start(): Promise<Response> {

      if (this.players.length < config.game.minPlayers) throw new CommandError(START_NOT_ENOUGH_PLAYERS)

      await this.assignRoles()

      await Promise.all(this.players.map(async player => {
         const user = await bot.users.fetch(player.discord)
         bot.embed(user, {
            title: `You are a **${player.role!.name}**`,
            message: 'Role description...',
            embed: {
               thumbnail: {
                  url: `https://raw.githubusercontent.com/PssbleTrngle/Werewolf-Grails/master/client/src/images/roles/${player.role!.name}.svg`,
                  height: 100,
                  width: 100,
               }
            }
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

   async win(condition: WinCondition, player?: Player) {
      await Win.create({ player, game: this, condition }).save()
   }

}