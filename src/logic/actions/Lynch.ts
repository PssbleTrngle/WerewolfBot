import bot from "../../bot";
import Game from "../../database/models/Game";
import Player from "../../database/models/Player";
import Action, { ALIVE, AND, OTHERS, Priority } from "../Action";
import Named from "../Named";

@Named
class Lynch extends Action {

   choices = AND(
      ALIVE,
      OTHERS
   )

   priority() {
      return Priority.LAST
   }

   async execute(game: Game, result: Player) {
      bot.embed(game.channel, `<@${result.discord}> was lynched`)
      await result.kill('The village lynched you')
   }

   description() {
      return 'Choose somebody to lynch'
   }

}

export default new Lynch()