import Player from "../database/models/Player"
import { Group } from "./Role"

export enum Priority {
   LAST = 0,
   LATER = 25,
   MID = 50,
   EARLIER = 75,
   FIRST = 100
}

export type TargetFilter = (player: Player, self?: Player) => boolean

export const SELF: TargetFilter = (p, s) => p.id === s?.id
export const OTHERS: TargetFilter = (p, s) => !SELF(p, s)
export const IN_GROUP = (group: Group): TargetFilter => p => p.inGroup(group)
export const ALIVE: TargetFilter = p => p.alive

export const NOT = (filter: TargetFilter): TargetFilter => (p, s) => !filter(p, s)
export const AND = (...filters: TargetFilter[]): TargetFilter => (p, s) => filters.every(f => f(p, s))
export const OR = (...filters: TargetFilter[]): TargetFilter => (p, s) => filters.some(f => f(p, s))

export interface Events {
   phase: 'night' | 'day'
   night: never
   day: never
   death: DeathCause
}
export type Event = keyof Events

export enum DeathCause {
   EATEN = 'eaten', 
   LYNCHED = 'lynched', 
   SHOT = 'shot'
}