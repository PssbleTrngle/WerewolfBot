import Action from "../Action";
import Named from "../Named";

@Named
class Sleeping extends Action {

   description() {
      return 'You fell tired and go to sleep'
   }

}

export default new Sleeping()