import dotenv from 'dotenv'
import { resolve } from 'path'
import { ConnectionOptions } from 'typeorm'

const { env } = process

export enum LogLevel {
   ERROR,
   WARN,
   SUCCESS,
   INFO,
   DEBUG,
}

dotenv.config()

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
   host: env.DATABASE_HOST,
   port: integer(env.DATABASE_PORT) ?? 5432,
   database: env.DATABASE_NAME ?? 'werewolf',
   username: env.DATABASE_USER ?? env.DATABASE_NAME ?? 'werewolf',
   password: env.DATABASE_PASS,
   logging: env.DATABASE_LOGGING === 'true',
   type: 'postgres',
   entities: [
      `${resolve(__dirname, 'database', 'models')}/**.js`,
      `${resolve(__dirname, 'database', 'models')}/**.ts`,
   ],
};

const discord = {
   token: required(env.BOT_TOKEN),
   prefix: env.BOT_PREFIX || 'w.',
   deleteCommandTriggers: env.BOT_DELETE_COMMAND_TRIGGERS === 'true'
};

const game = {
   maxGames: integer(env.MAX_GAMES) ?? Number.MAX_SAFE_INTEGER,
   minPlayers: integer(env.MIN_PLAYERS) ?? 5,
   maxPlayers: integer(env.MAX_PLAYERS) ?? Number.MAX_SAFE_INTEGER,
   playerRole: integer(env.PLAYER_ROLE),
   forcePlayer: env.FORCE_PLAYERS !== 'false',
   autoStart: env.AUTOSTART === 'false' ? undefined : (integer(env.AUTOSTART) ?? 20)
}

const logLevel = (s?: string): LogLevel | undefined => {
   return (LogLevel as any)[s?.toUpperCase() ?? '']
}

const logger = {
   channel: {
      id: env.LOG_CHANNEL,
      level: logLevel(env.LOG_LEVEL_CHANNEL) ?? LogLevel.ERROR,
   },
   console: {
      level: logLevel(env.LOG_LEVEL_CONSOLE) ?? LogLevel.INFO,
   }
}

export default { db, discord, logger, game };
