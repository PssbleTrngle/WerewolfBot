import { Event, Events } from "."
import Game from "../database/models/Game"
import Player from "../database/models/Player"

export enum Group {
   WOLF,
   VILLAGER,
}

type Subscriber<E extends Event> = (game: Game, subject: Events[E]) => Promise<void>

export default abstract class Role {

   private static VALUES = new Map<string, Role>()

   readonly name!: string
   readonly groups: Group[] = []

   private subscribers = new Map<Event, Subscriber<any>[]>()

   onEach<E extends Event>(event: E, sub: (player: Player, game: Game, subject: Events[E]) => Promise<void>) {
      this.on(event, async (game, subject) => {
         await Promise.all(game.players.map(async p => sub(p, game, subject)))
      })
   }

   on<E extends Event>(event: E, sub: Subscriber<E>) {
      const subs = this.subscribers.get(event) ?? []
      subs.push(sub)
      this.subscribers.set(event, subs)
   }

   async call<E extends Event>(event: E, game: Game, subject?: Events[E]) {
      const subs = this.subscribers.get(event) ?? []
      await Promise.all(subs.map(s => s(game, subject)))
   }

   constructor() {
      Role.VALUES.set(this.name, this)
   }

   static get(name: string) {
      return this.VALUES.get(name)
   }

}