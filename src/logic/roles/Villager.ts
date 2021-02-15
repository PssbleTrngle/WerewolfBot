import Named from "../Named";
import Role, { Group } from "../Role";

@Named
class Villager extends Role {

   readonly groups = [Group.VILLAGER]

}

export default new Villager()