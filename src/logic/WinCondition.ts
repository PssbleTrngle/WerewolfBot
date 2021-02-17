import { Priority, TargetFilter } from "."
import Player from "../database/models/Player"

export default class WinCondition {

   private static VALUES = new Map<string, WinCondition>()

   constructor(
      public readonly name: string,
      private readonly winnerFilter: TargetFilter,
      public readonly message: string,
      public readonly priotity: number = Priority.MID,
   ) {
      WinCondition.VALUES.set(this.name, this)
   }

   static get(name: string) {
      return this.VALUES.get(name)
   }

   winners(self: Player | undefined, players: Player[]) {
      return players.filter(p => this.winnerFilter(p, self))
   }

}