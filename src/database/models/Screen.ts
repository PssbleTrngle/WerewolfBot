import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import bot from '../../bot';
import Action from '../../logic/Action';
import { NamedColumn } from '../../logic/Named';
import { exist as exists, unique } from '../../utils';
import Game from './Game';
import Player from './Player';
import PlayerToScreen from './PlayerToScreen';

@Entity()
export default class Screen extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @NamedColumn(() => Action)
   action!: Action

   @Column()
   requiresInput!: boolean

   @Column({ default: false })
   done!: boolean

   @Column({ nullable: true })
   result!: string

   @OneToMany(() => PlayerToScreen, p => p.screen, { eager: true, cascade: true })
   playerScreens!: PlayerToScreen[]

   @ManyToOne(() => Game, g => g.screens, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'gameId' })
   game!: Promise<Partial<Game>> | Game
   @Column()
   gameId!: number

   get players() {
      return this.playerScreens.map(p => p.player)
   }

   getGame() {
      return Game.findOneOrFail(this.gameId)
   }

   static async createFor(action: Action, ...players: Player[]) {
      if(players.length === 0) return
      
      const game = await Game.findOneOrFail(players[0].gameId)

      const screen = this.create({ action, game })

      const choices = await screen.choices(undefined, game)
      screen.requiresInput = (choices?.length ?? 0) > 0

      await screen.save()

      screen.playerScreens = players.map(player =>
         PlayerToScreen.create({ player, screenId: screen.id })
      )

      await screen.save()
      await Promise.all(screen.playerScreens.map(s => s.notifyOnCreation()))

      return screen
   }

   /**
    * Mark the screen as done
    */
   async close() {
      this.done = true
      await this.save()
      await this.notifyNext()

      const game = await this.getGame()
      await game.checkScreens()
   }

   /**
    * Called when the screen is done
    * Notifies all players on this screen about their next screen
    */
   private async notifyNext() {
      await Promise.all(this.players.map(async player => {
         const active = await player.activeScreen()
         if (active) {
            if(active.id === this.id) throw new Error('Very weird recursion, active screen returns closed screen')

            const screen = active.playerScreens.find(s => s.playerId === player.id)
            if (!screen) throw new Error('Player screen missing')

            const alsoDone = await active.closeIfDone()
            if (!alsoDone) await active.notify(screen)
         }
      }))
   }

   async notify(screen: PlayerToScreen) {
      const user = await bot.users.fetch(screen.player.discord)

      const game = await Game.findOneOrFail(screen.player.gameId)
      const choices = await this.choices(screen.player, game)

      const message = await (async () => {
         if (choices) {
            const reactions = this.action.reactions.slice(0, choices.length)

            const message = await bot.embed(user, {
               title: this.action.description(),
               message: [
                  'Choose a target', '',
                  ...choices.map((t, i) => `${reactions[i]}   ${typeof t === 'string' ? t : t.name}`),
               ]
            })

            await Promise.all(reactions.map(e => message.react(e)))
            return message

         } else {
            return bot.embed(user, { title: this.action.description() })
         }
      })()

      screen.message = message.id
      await screen.save()

   }

   async choices(self?: Player, game?: Game): Promise<Array<Player | string> | undefined> {
      const { choices } = this.action

      if (!choices) return undefined
      if (Array.isArray(choices)) return choices

      const { players } = game ?? await this.getGame()
      return players.filter(p => choices(p, self))
   }

   async closeIfDone() {
      const isDone = await this.isDone()

      if (isDone) {

         if (this.requiresInput) {

            const selections = await this.selections()
            if (!selections?.length) throw new Error('Screen should not be marked as done')

            const top = selections.sort((a, b) => b.count - a.count)[0].choice
            this.result = typeof top === 'string' ? top : top.discord

         }

         await this.close()

      }

      return isDone
   }

   async isDone() {

      if (this.requiresInput) {

         return !this.playerScreens.some(s => !exists(s.chosen))

      } else {

         const here = await Promise.all(this.playerScreens
            .map(s => s.player.activeScreen()))
            .then(a => a.filter(exists))
            .then(a => a.filter(screen => screen.id === this.id))

         return here.length === this.playerScreens.length

      }

   }

   async selections() {
      const indezes = this.playerScreens.map(s => s.chosen).filter(exists)
      const choices = await this.choices()
      return choices && indezes.filter(unique).map(i => ({
         choice: choices[i],
         count: indezes.filter(i2 => i2 === i).length,
      }))
   }

   async chosen() {
      if(!this.requiresInput) return undefined
      if (Array.isArray(this.action.choices)) return this.result
      else return Player.findOneOrFail({ discord: this.result, gameId: this.gameId })
   }

}