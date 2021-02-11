import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import config from '../../config';
import CommandError from '../../errors/CommandError';
import Game from "./Game";

@Entity()
@Index('discord_user_per_game', p => [p.discord, p.game], { unique: true })
export default class Player extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @Column('varchar')
   discord!: string

   @ManyToOne(() => Game, g => g.players, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'gameId' })
   game!: Game | Promise<Game>;

   @Column()
   gameId!: number

   async leave() {
      const game = await Game.findOneOrFail(this.gameId)

      if (game.started && game.players.length <= config.game.minPlayers) {
         if (config.game.forcePlayer) throw new CommandError('Cannot leave started game if there are not enough players')
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

}