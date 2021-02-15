import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import config from '../../config';
import CommandError, { LEAVE_NOT_ENOUGH_PLAYERS } from '../../errors/CommandError';
import Action from '../../logic/Action';
import { NamedColumn } from '../../logic/Named';
import Role, { Group } from '../../logic/Role';
import Game from "./Game";
import PlayerToScreen from './PlayerToScreen';
import Screen from './Screen';

@Entity()
@Index('discord_user_per_game', p => [p.discord, p.game], { unique: true })
export default class Player extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @Column('varchar')
   discord!: string

   @Column('varchar')
   name!: string

   @ManyToOne(() => Game, g => g.players, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'gameId' })
   game!: Game | Promise<Game>;

   @Column()
   gameId!: number

   @NamedColumn(() => Role, { nullable: true })
   role?: Role

   @OneToMany(() => PlayerToScreen, s => s.player)
   screens!: Promise<PlayerToScreen[]>

   async activeScreen() {
      const join = await PlayerToScreen.findOne(
         { player: this },
         { relations: ['screen', 'player'] }
      )
      return join?.screen
   }

   async leave() {
      const game = await Game.findOneOrFail(this.gameId)

      if (game.started && game.players.length <= config.game.minPlayers) {
         if (config.game.forcePlayer) throw new CommandError(LEAVE_NOT_ENOUGH_PLAYERS)
         else {

            await game.remove()
            return null;
         }

      } else if (game.players.length === 1) {

         await game.remove()
         return null

      } else {

         await this.remove()
         await game.reload()

         return game
      }
   }

   screen(action: Action) {
      return Screen.createFor(action, this)
   }

   inGroup(group: Group) {
      return this.role?.groups.includes(group) ?? false
   }

}