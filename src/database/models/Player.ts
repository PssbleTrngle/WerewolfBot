import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Game from "./Game";

@Entity()
@Index('discord_user_per_game', p => [p.discord, p.game], { unique: true })
export default class Player extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @Column('varchar')
   discord!: string

   @ManyToOne(() => Game, g => g.players)
   game!: Game | Promise<Game>;

}