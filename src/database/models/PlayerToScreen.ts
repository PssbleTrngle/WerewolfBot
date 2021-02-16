import { GuildEmoji, ReactionEmoji } from 'discord.js';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

   @Column({ nullable: true })
   chosen!: number

   @Column({ nullable: true })
   message!: string

   async notify() {
      const active = await this.player.activeScreen()
      if (active?.id === this.screenId) {
         const message = await active.notify(this.player)
         this.message = message.id
         await this.save()
      }
   }

   async react(emoji: GuildEmoji | ReactionEmoji, by: string) {

      const screen = await Screen.findOneOrFail(this.screenId)
      const choiceIndex = screen.action.reactions.findIndex(r => emoji.toString() === r)

      if (choiceIndex < 0) return false;

      this.chosen = choiceIndex
      await this.save()

      await screen.check()

   }

}