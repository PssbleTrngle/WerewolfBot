import dotenv from 'dotenv'
import { resolve } from 'path'
import { ConnectionOptions } from 'typeorm'

export enum LogLevel {
   ERROR,
   WARN,
   SUCCESS,
   INFO,
   DEBUG,
}

dotenv.config()

const {
   DATABASE_LOGGING, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_PASS, DATABASE_USER,
   BOT_TOKEN, BOT_PREFIX, BOT_DELETE_COMMAND_TRIGGERS,
   LOG_CHANNEL, LOG_LEVEL_CHANNEL, LOG_LEVEL_CONSOLE,
   MAX_GAMES, PLAYER_ROLE, MIN_PLAYERS, MAX_PLAYERS, FORCE_PLAYERS
} = process.env

const required = (s?: string) => {
   if (s) return s
   else throw new Error('Missing config option')
}

const integer = (s?: string) => {
   const n = Number.parseInt(s ?? '')
   return isNaN(n) ? undefined : n
}

const db: ConnectionOptions = {
   synchronize: true,
   host: DATABASE_HOST,
   port: integer(DATABASE_PORT) ?? 5432,
   database: DATABASE_NAME ?? 'werewolf',
   username: DATABASE_USER ?? DATABASE_NAME ?? 'werewolf',
   password: DATABASE_PASS,
   logging: DATABASE_LOGGING === 'true',
   type: 'postgres',
   entities: [
      `${resolve(__dirname, 'database', 'models')}/**.js`,
      `${resolve(__dirname, 'database', 'models')}/**.ts`,
   ],
};

const discord = {
   token: required(BOT_TOKEN),
   prefix: BOT_PREFIX || 'w.',
   deleteCommandTriggers: BOT_DELETE_COMMAND_TRIGGERS === 'true'
};

const game = {
   maxGames: integer(MAX_GAMES) ?? Number.MAX_SAFE_INTEGER,
   minPlayers: integer(MIN_PLAYERS) ?? 5,
   maxPlayers: integer(MAX_PLAYERS) ?? Number.MAX_SAFE_INTEGER,
   playerRole: integer(PLAYER_ROLE),
   forcePlayer: FORCE_PLAYERS !== 'false',
}

const logLevel = (s?: string): LogLevel | undefined => {
   return (LogLevel as any)[s?.toUpperCase() ?? '']
}

const logger = {
   channel: {
      id: LOG_CHANNEL,
      level: logLevel(LOG_LEVEL_CHANNEL) ?? LogLevel.ERROR,
   },
   console: {
      level: logLevel(LOG_LEVEL_CONSOLE) ?? LogLevel.INFO,
   }
}

export default { db, discord, logger, game };
