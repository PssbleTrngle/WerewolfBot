import Game from "../../database/models/Game";
import Player from "../../database/models/Player";
import Action, { ALIVE, AND, IN_GROUP, NOT, Priority } from "../Action";
import Named from "../Named";
import { Group } from "../Role";

@Named
class Eat extends Action {

   choices = AND(
      ALIVE,
      NOT(IN_GROUP(Group.WOLF)),
   )

   priority() {
      return Priority.MID
   }

   async execute(game: Game, chosen: Player) {
      await chosen.kill('You were eaten by the wolves')
   }

   description() {
      return 'You are hungry, choose someone to munchy munch'
   }

}

export default new Eat()