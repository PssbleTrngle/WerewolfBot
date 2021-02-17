import { GuildEmoji, PartialTextBasedChannelFields, ReactionEmoji } from 'discord.js';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import bot from '../../bot';
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
   @JoinColumn({ name: 'playerId' })
   player!: Player
   @Column()
   playerId!: number

   @Column({ nullable: true })
   chosen?: number

   @Column({ nullable: true })
   message!: string

   async notifyOnCreation() {
      const active = await this.player.activeScreen()
      if (active?.id === this.screenId) await active.notify(this)
   }

   async react(emoji: GuildEmoji | ReactionEmoji, channel: PartialTextBasedChannelFields) {

      if (this.chosen) return false

      const screen = await Screen.findOneOrFail(this.screenId)
      const choices = await screen.choices()

      if (!choices) return false

      const choiceIndex = screen.action.reactions.findIndex(r => emoji.toString() === r)

      if (choiceIndex < 0 || choiceIndex >= choices.length) return false

      this.chosen = choiceIndex
      await this.save()

      const selection = choices[choiceIndex]
      if (selection) {
         const display = typeof selection === 'string' ? selection : selection.name
         bot.embed(channel, `You choose **${display}**`)
      }

      await screen.reload()
      await screen.closeIfDone()
   }

}