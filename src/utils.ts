import { readdirSync, statSync } from "fs"
import { extname, join } from "path"

export function importAllWithName<T = unknown>(dir: string) {
   const folder = join(__dirname, dir)

   const files = readdirSync(folder).filter(f =>
      statSync(join(folder, f)).isFile && ['.ts', '.js'].includes(extname(f))
   )

   return Promise.all(files.map(async f => {
      const m = require(join(folder, f)) as any
      return [f, m.default] as [string, T]
   }))

}

export async function importAll<T = unknown>(dir: string) {
   const modules = await importAllWithName<T>(dir)
   return modules.map(([, mod]) => mod)
}

export function arrayOf(length: number) {
   return new Array(Math.floor(length)).fill(null).map((_, i) => i)
}