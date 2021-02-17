import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import config from '../../config';
import CommandError, { LEAVE_NOT_ENOUGH_PLAYERS } from '../../errors/CommandError';
import { DeathCause } from '../../logic';
import Action from '../../logic/Action';
import { NamedColumn } from '../../logic/Named';
import Role, { Group } from '../../logic/Role';
import Death from './Death';
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

   @Column({ default: true })
   alive!: boolean

   @OneToMany(() => Death, d => d.player, { eager: true })
   deaths!: Death[]

   @OneToMany(() => PlayerToScreen, s => s.player)
   screens!: Promise<Partial<PlayerToScreen>[]>

   get icon() {
      return this.alive ? '👨‍🌾' : '💀'
   }

   async activeScreen() {
      const screen = await Screen.createQueryBuilder('screen')
         .leftJoinAndSelect('screen.playerScreens', 'playerScreen')
         .where('playerScreen.playerId = :player', { player: this.id })
         .andWhere('screen.done = false')
         .getOne()
      return screen && Screen.findOne(screen.id)
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

   /**
    * @param diesIn Amount of half-days until the player dies 
    */
   async kill(cause: DeathCause, diesIn = 0) {
      await Death.create({ player: this, in: diesIn, cause }).save()
   }

   screen(action: Action) {
      return Screen.createFor(action, this)
   }

   inGroup(group: Group) {
      return this.role?.groups.includes(group) ?? false
   }

}