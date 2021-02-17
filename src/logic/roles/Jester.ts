import { DeathCause, Priority, SELF } from "..";
import Named from "../Named";
import Role, { Group } from "../Role";
import WinCondition from '../WinCondition';

@Named
class Jester extends Role {

   readonly groups = [Group.VILLAGER]

}

const role = new Jester()
const win = new WinCondition('jester', SELF, 'The jester won!', Priority.FIRST)

role.onEach('death', async (player, game, cause) => {
   if (cause === DeathCause.LYNCHED) await game.win(win, player)
})

export default role