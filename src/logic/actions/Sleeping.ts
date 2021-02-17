import bot from "../../bot";
import Game from "../../database/models/Game";
import Action from "../Action";
import Named from "../Named";

@Named
class Sleeping extends Action {

   description() {
      return 'You got tired and fell asleep'
   }
   
   async execute(game: Game) {
      await bot.embed(game.channel, await game.setDay())
   }

}

export default new Sleeping()