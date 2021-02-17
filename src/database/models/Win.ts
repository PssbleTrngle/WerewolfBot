import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NamedColumn } from '../../logic/Named';
import WinCondition from '../../logic/WinCondition';
import Game from './Game';
import Player from './Player';

@Entity()
export default class Win extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @NamedColumn(() => WinCondition)
   condition!: WinCondition

   @ManyToOne(() => Player, { nullable: true })
   @JoinColumn({ name: 'playerId' })
   player?: Player | Promise<Player>
   @Column({ nullable: true })
   playerId?: number

   @ManyToOne(() => Game, { onDelete: 'CASCADE' })
   game?: Game | Promise<Game>

}