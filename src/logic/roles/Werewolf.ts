import { IN_GROUP } from "../";
import Eat from "../actions/Eat";
import Named from "../Named";
import Role, { Group } from "../Role";
import WinCondition from "../WinCondition";

@Named
class Werewolf extends Role {

   readonly groups = [Group.WOLF]

}

const FILTER = IN_GROUP(Group.WOLF)

const role = new Werewolf()
const win = new WinCondition('wolves', IN_GROUP(Group.WOLF), 'The wolves won!')

role.on('night', async ({ alive }) => {

   await Eat.screen(alive.filter(p => FILTER(p)))

})

role.on('phase', async game => {
   if (game.alive.every(p => FILTER(p))) await game.win(win)
})

export default role