import { readdirSync, statSync } from "fs"
import { join } from "path"

export function importAll(dir: string) {
   const folder = join(__dirname, dir)

   const files = readdirSync(folder)

   return Promise.all(files
      .filter(f => statSync(f).isFile && f.endsWith('.ts'))
      .map(f => import(join(folder, f)))
   ).then(a => a.map(i => i.default))
   
}