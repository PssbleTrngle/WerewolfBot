import Game from "../database/models/Game"
import Player from "../database/models/Player"

export enum Group {
   WOLF,
   VILLAGER,
}

type Event = 'night' | 'day' | 'noon'

type Subscriber<P> = (subject: P) => Promise<void> | void

export default abstract class Role {

   private static VALUES = new Map<string, Role>()

   readonly name!: string
   readonly groups: Group[] = []

   private subscribers = new Map<Event, Subscriber<Player[]>[]>()

   onEach(event: Event, sub: Subscriber<Player>) {
      this.on(event, async players => {
         await Promise.all(players.map(sub))
      })
   }

   on(event: Event, sub: Subscriber<Player[]>) {
      const subs = this.subscribers.get(event) ?? []
      subs.push(sub)
      this.subscribers.set(event, subs)
   }

   async call(event: Event, game: Game) {
      const subs = this.subscribers.get(event) ?? []
      await Promise.all(subs.map(s => s(game.players)))
   }

   constructor() {
      Role.VALUES.set(this.name, this)
   }

   static get(name: string) {
      return this.VALUES.get(name)
   }

}