import { Column } from "typeorm"
import { ColumnCommonOptions } from "typeorm/decorator/options/ColumnCommonOptions"

interface Reference { name: string }

export interface Named<R extends Reference> {
   get(name: string): R | undefined;
}

export default (clazz: Function) => {
   const name = clazz.name.toLowerCase()
   Object.defineProperty(clazz.prototype, 'name', {
      get() {
         return name
      }
   })
}

export const NamedColumn = <R extends Reference>(Named: () => Named<R>, options: ColumnCommonOptions = {}) => Column('varchar', {
   ...options, transformer: {
      to: (action: R | null) => action?.name ?? null,
      from: (name: string) => Named().get(name)
   }
})
