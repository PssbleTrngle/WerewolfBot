import { IN_GROUP } from "..";
import Named from "../Named";
import Role, { Group } from "../Role";
import WinCondition from '../WinCondition';

@Named
class Villager extends Role {

   readonly groups = [Group.VILLAGER]

}

const FILTER = IN_GROUP(Group.VILLAGER)

const role = new Villager()
const win = new WinCondition('village', FILTER, 'The village won!')

role.on('phase', async game => {
   if (game.alive.every(p => FILTER(p))) await game.win(win)
})

export default role