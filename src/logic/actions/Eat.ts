import Action, { IN_GROUP, NOT } from "../Action";
import Named from "../Named";
import { Group } from "../Role";

@Named
class Eat extends Action {

   isTarget = NOT(IN_GROUP(Group.WOLF))

   description() {
      return 'You are hungry, choose someone to munchy munch'
   }

}

export default new Eat()