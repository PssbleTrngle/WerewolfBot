import { User } from "discord.js";
import { Argument } from "../commands";

export const COMMAND_NOT_FOUND = (id: string) => `Command \`${id}\` not found`
export const INVALID_ARGUMENT = (arg: Argument) => `Invalid argument for \`${arg.name ?? arg.type}\``
export const NOT_AUTHORIZED = 'You are not authorized to use this command'
export const REQUIRES_SUBCOMMAND = (id: string) => `Command \`${id}\` requires a subcommand`
export const TO_MANY_ARGS = 'To many arguments given'
export const MISSING_ARG = (arg: Argument) => `Missing argument \`${arg.name ?? arg.type}\``

export const USER_MISSING = (name: string) => `Could not find user \`${name}\``

export const MAX_GAMES = 'The maximum amount of games has been reached'
export const GAME_MISSING = 'No game has been created yet in this channel'
export const GAME_FULL = 'This game is already full'
export const NOT_IN_GAME = 'You are not part of this game'
export const GAME_EXISTING = 'There is alread a game in the current channel'
export const ALREADY_JOINED = 'You already joined the game'
export const LEAVE_NOT_ENOUGH_PLAYERS = 'Cannot leave started game if there are not enough players'
export const START_NOT_ENOUGH_PLAYERS = 'Not enought players to start game'

export default class CommandError extends Error {

   constructor(message: string, public readonly by?: User) {
      super(message)
   }

}