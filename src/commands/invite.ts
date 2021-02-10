import { createSlashCommand } from "https://deno.land/x/discordeno@10.2.0/src/api/handlers/webhook.ts";
import config from "../config.ts";

export default () => createSlashCommand({
   name: 'invite',
   description: 'Invite this bot to your own server',
   guildID: config.discord.guild
});