import { User } from "discord.js";

export default class CommandError extends Error {

   constructor(message: string, public readonly by?: User) {
      super(message)
   }

}