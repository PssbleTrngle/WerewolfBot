import { Priority } from "../";
import Action from "../Action";
import Named from "../Named";

@Named
class Sleeping extends Action {

   priority() {
      return Priority.LAST
   }

   description() {
      return 'You got tired and fell asleep'
   }
   
   async execute() {}

}

export default new Sleeping()