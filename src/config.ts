import coffee from "https://deno.land/x/coffee/mod.ts";

coffee.load({
   configDir: Deno.cwd() + '/config'
})

const get = (path: string) => coffee.get(path)
const has = (path: string) => coffee.has(path)
const optional = (path: string) => has(path) ? get(path) : undefined

const db = {
   host: get("database.host").string(),
   port: optional("database.port")?.number(),
   name: get("database.name").string(),
   password: get("database.password").string(),
   username: get("database.username").string(),
   drop: get("database.drop").boolean() ?? false,
};

const discord = {
   token: get("discord.token").string(),
   guild: optional('discord.guild')?.string(),
};

export default { db, discord };
