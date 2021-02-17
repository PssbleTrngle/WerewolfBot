import Game from "../database/models/Game"
import Player from "../database/models/Player"
import Screen from "../database/models/Screen"
import { Group } from "./Role"

export type TargetFilter = (player: Player, self?: Player) => boolean

export const SELF: TargetFilter = (p, s) => p.id === s?.id
export const OTHERS: TargetFilter = (p, s) => !SELF(p, s)
export const IN_GROUP = (group: Group): TargetFilter => p => p.inGroup(group)
export const ALIVE: TargetFilter = p => p.alive

export const NOT = (filter: TargetFilter): TargetFilter => (p, s) => !filter(p, s)
export const AND = (...filters: TargetFilter[]): TargetFilter => (p, s) => filters.every(f => f(p, s))
export const OR = (...filters: TargetFilter[]): TargetFilter => (p, s) => filters.some(f => f(p, s))

export const NUMERALS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
export const BOOLEAN = ['✅', '❌']

export enum Priority {
   LAST = 0,
   LATER = 25,
   MID = 50,
   EARLIER = 75,
   FIRST = 100,
}

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