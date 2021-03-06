import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DeathCause } from '../../logic';
import Player from './Player';

@Entity()
export default class Death extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @ManyToOne(() => Player, p => p.deaths)
   player!: Player | Promise<Player>

   @Column({ unsigned: true })
   in!: number

   @Column({ enum: DeathCause})
   cause!: DeathCause

}