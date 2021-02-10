import { dirname, fromFileUrl, join } from 'https://deno.land/std@0.86.0/path/mod.ts'

export function importAll(dir: string) {
   const base = dirname(fromFileUrl(import.meta.url))
   const folder = join(base, dir)

   const files = [...Deno.readDirSync(folder)]

   return Promise.all(files
      .filter(f => f.isFile && f.name.endsWith('.ts'))
      .map(f => import(`file://${folder}/${f.name}`))
   ).then(a => a.map(i => i.default))
}