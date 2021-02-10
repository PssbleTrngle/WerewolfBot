import { DataTypes, Model } from 'https://deno.land/x/denodb/mod.ts';
import { Channel } from "https://deno.land/x/discordeno@10.2.0/src/api/structures/channel.ts";
import { UserPayload } from "https://deno.land/x/discordeno@10.2.0/src/types/guild.ts";
import Player from "./Player.ts";

export default class Game extends Model {

   static table = 'games'
   static timestamps = true

   id!: number;
   channel!: string

   static fields = {
      id: { primaryKey: true, autoIncrement: true },
      channel: { type: DataTypes.STRING,  unique: true }
   }

   static async inChannel(channel: Channel | string): Promise<Game | null> {
      const id = typeof channel === 'string' ? channel : channel.id
      const games = await Game.where('channel', id).get() as Game[]
      return games[0]
   }

   static async start(player: UserPayload, channel: string) {

      const existing = await Game.inChannel(channel)
      if(existing) throw new Error('There is alread a game in the current channel')

      const game = await Game.create({ channel }) as Game      
      
      await game.join(player)

      return `<@${player.id}> started a new game`
   }

   async join(discord: UserPayload) {
      const player = await Player.create({
         discord: discord.id,
         gameId: this.id
      }) as Player

      return player
   }

   static players() {
      return this.hasMany(Player)
   }

}