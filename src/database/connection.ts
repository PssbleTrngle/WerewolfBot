import { Database, PostgresConnector } from 'https://deno.land/x/denodb/mod.ts';
import config from "../config.ts";
import Logger from "../logger.ts";
import { importAll } from "../utils.ts";

export default async () => {
   const connection = new PostgresConnector({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      username: config.db.username,
      password: config.db.password,
   })

   const db = new Database(connection)

   const models = await importAll('database/models')
   db.link(models)

   await db.sync({ drop: config.db.drop })

   Logger.success('Database connected')
}