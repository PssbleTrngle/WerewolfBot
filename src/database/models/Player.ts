import { DataTypes, Model, Relationships } from 'https://deno.land/x/denodb/mod.ts';
import Game from "./Game.ts";

export default class Player extends Model {

   static table = 'players'
   static timestamps = true

   gameId!: number
   discord!: string

   static fields = {
      id: { primaryKey: true, autoIncrement: true },
      discord: DataTypes.STRING,
      gameId: Relationships.belongsTo(Game),
   }

   static game() {
      return this.hasOne(Game)
   }

}