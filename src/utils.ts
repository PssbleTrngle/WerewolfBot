import { readdirSync, statSync } from "fs"
import { join } from "path"

export function importAllWithName<T = unknown>(dir: string) {
   const folder = join(__dirname, dir)

   const files = readdirSync(folder).filter(f => statSync(join(folder, f)).isFile && f.endsWith('.ts'))

   return Promise.all(files.map(async f => {
      const m = require(join(folder, f)) as any
      return [f, m.default ?? m] as [string, T]
   }))

}

export async function importAll<T = unknown>(dir: string) {
   const modules = await importAllWithName<T>(dir)
   return modules.map(([, mod]) => mod)
}