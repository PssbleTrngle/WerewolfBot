import Player from "../database/models/Player"
import Screen from "../database/models/Screen"
import { Group } from "./Role"

export type TargetFilter = (player: Player, self?: Player) => boolean

export const SELF: TargetFilter = (p, s) => p.id === s?.id
export const OTHERS: TargetFilter = (p, s) => !SELF(p, s)
export const IN_GROUP = (group: Group): TargetFilter => p => p.inGroup(group)

export const NOT = (filter: TargetFilter): TargetFilter => (p, s) => !filter(p, s)
export const AND = (...filters: TargetFilter[]): TargetFilter => (p, s) => filters.every(f => f(p, s))
export const OR = (...filters: TargetFilter[]): TargetFilter => (p, s) => filters.some(f => f(p, s))

export default abstract class Action {

   private static VALUES = new Map<string, Action>()

   public readonly name!: string

   abstract description(): string

   isTarget: TargetFilter = () => false

   choices(): string[] {
      return []
   }

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