import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import PlayerToScreen from './PlayerToScreen';

@Entity()
export default class Choice extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @ManyToOne(() => PlayerToScreen, s => s.choice)
   screen!: PlayerToScreen | Promise<PlayerToScreen>

   @Column()
   value!: string

}