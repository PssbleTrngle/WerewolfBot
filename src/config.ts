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
   DISCORD_BOT_TOKEN,
   LOG_CHANNEL, LOG_LEVEL_CHANNEL, LOG_LEVEL_CONSOLE
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
   port: integer(DATABASE_PORT) ?? 80,
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
   token: required(DISCORD_BOT_TOKEN),
};

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

export default { db, discord, logger };
