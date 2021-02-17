import { TargetFilter } from "."
import Game from "../database/models/Game"
import Player from "../database/models/Player"
import Screen from "../database/models/Screen"

export const NUMERALS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
export const BOOLEAN = ['✅', '❌']

export default abstract class Action {

   private static VALUES = new Map<string, Action>()

   public readonly name!: string
   public readonly reactions = NUMERALS

   abstract priority(): number;

   abstract description(): string

   choices?: TargetFilter | string[]

   abstract execute(game: Game, chosen: Player | string | undefined): Promise<void>

   constructor() {
      Action.VALUES.set(this.name, this)
   }

   static get(name: string) {
      return this.VALUES.get(name)
   }

   screen(players: Player[]) {
      return Screen.createFor(this, ...players)
   }

}