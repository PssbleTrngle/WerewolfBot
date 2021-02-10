import { createConnection } from "typeorm"
import config from "../config"
import logger from "../logger"

export default async () => {
   const connection = await createConnection(config.db)

   logger.success('Database connected')
   logger.debug(`Found ${connection.entityMetadatas.length} models`)

   return connection
}