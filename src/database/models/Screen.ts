import { TextChannel } from 'discord.js';
import { BaseEntity, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import bot from '../../bot';
import Action from '../../logic/Action';
import { NamedColumn } from '../../logic/Named';
import Game from './Game';
import Player from './Player';
import PlayerToScreen from './PlayerToScreen';

@Entity()
export default class Screen extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @NamedColumn(() => Action)
   action!: Action

   @OneToMany(() => PlayerToScreen, p => p.screen, { eager: true, cascade: true })
   playerScreens!: PlayerToScreen[]

   get players() {
      return this.playerScreens.map(p => p.player)
   }

   get choices() {
      return this.playerScreens.map(p => p.choice)
   }

   static async createFor(action: Action, ...players: Player[]) {
      const screen = await this.create({ action }).save()

      screen.playerScreens = players.map(player =>
         PlayerToScreen.create({ player, screenId: screen.id })
      )

      await screen.save()
      screen.playerScreens.forEach(s => s.notify())

      return screen
   }

   async close() {
      await this.notifyNext()
      await this.remove()
   }

   private async notifyNext() {
      await Promise.all(this.players.map(async p => {
         const active = await p.activeScreen()
         await active?.notify(p)
      }))
   }

   async notify(player: Player) {
      const user = await bot.users.fetch(player.discord)

      const game = await this.game()
      const channel = bot.channels.resolve(game.channel) as TextChannel
      const targets = await this.targets(player, game)

      await bot.embed(user, targets.length ? [
         'Choose a target',
         targets.map(t => t.name).join(', '),
      ] : undefined, this.action.description())

   }

   async game() {
      const [player] = this.players
      return Game.findOneOrFail(player.gameId)
   }

   async targets(self?: Player, game?: Game) {
      const { players } = game ?? await this.game()
      return players.filter(p =>
         this.action.isTarget(p, self)
      )
   }

   async done() {
      const targets = await this.targets()
      return targets.length === this.choices.length
   }

}