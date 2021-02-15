import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import Choice from './Choice';
import Player from './Player';
import Screen from './Screen';

@Entity()
export default class PlayerToScreen extends BaseEntity {

   @PrimaryGeneratedColumn()
   id!: number

   @ManyToOne(() => Screen, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'screenId' })
   screen!: Promise<Screen>;

   @Column()
   screenId!: number

   @ManyToOne(() => Player, { eager: true, onDelete: 'CASCADE' })
   player!: Player

   @OneToOne(() => Choice, c => c.screen, { eager: true, nullable: true })
   @JoinColumn()
   choice?: Choice

   async notify() {
      const active = await this.player.activeScreen()
      if (active?.id === this.screenId) active.notify(this.player)
   }

}