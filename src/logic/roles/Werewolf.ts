import Eat from "../actions/Eat";
import Named from "../Named";
import Role, { Group } from "../Role";

@Named
class Werewolf extends Role {

   readonly groups = [Group.WOLF]

}

const role = new Werewolf()
role.on('night', players => {

   Eat.screen(players.filter(p => p.inGroup(Group.WOLF)))

})

export default role