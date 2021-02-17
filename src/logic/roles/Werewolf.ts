import { ALIVE, AND, IN_GROUP } from "../Action";
import Eat from "../actions/Eat";
import Named from "../Named";
import Role, { Group } from "../Role";

@Named
class Werewolf extends Role {

   readonly groups = [Group.WOLF]

}

const role = new Werewolf()
role.on('night', async players => {

   const wolfFilter = AND(ALIVE, IN_GROUP(Group.WOLF))
   await Eat.screen(players.filter(p => wolfFilter(p)))

})

export default role