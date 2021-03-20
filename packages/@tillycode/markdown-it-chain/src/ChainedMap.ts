import merge from 'deepmerge'
import Chainable from './Chainable'

export class TypedChainedMap<Parent, Value> extends Chainable<Parent> {
  public readonly store: Map<string, Value>

  constructor(parent: Parent) {
    super(parent)
    this.store = new Map<string, Value>()
  }

  // extend is removed

  clear(): this {
    this.store.clear()
    return this
  }

  delete(key: string): this {
    this.store.delete(key)
    return this
  }

  order(): {
    entries: Record<string, Value>
    order: string[]
  } {
    const entries = [...this.store].reduce(
      (acc: Record<string, Value>, [key, value]: [string, Value]) => {
        acc[key] = value
        return acc
      },
      {}
    )
    const names = Object.keys(entries)
    const order = [...names]

    names.forEach((name) => {
      if (!entries[name]) {
        return
      }

      const { __before, __after } = entries[name] as {
        __before?: string
        __after?: string
      }

      if (__before && order.includes(__before)) {
        order.splice(order.indexOf(name), 1)
        order.splice(order.indexOf(__before), 0, name)
      } else if (__after && order.includes(__after)) {
        order.splice(order.indexOf(name), 1)
        order.splice(order.indexOf(__after) + 1, 0, name)
      }
    })

    return { entries, order }
  }

  entriesMap(): Record<string, Value> | undefined {
    const { entries, order } = this.order()

    if (order.length) {
      return entries
    }

    return undefined
  }

  entries(): Array<[string, Value]> {
    const { entries, order } = this.order()

    return order.map((name) => [name, entries[name]])
  }

  values(): Value[] {
    const { entries, order } = this.order()

    return order.map((name) => entries[name])
  }

  get(key: string): Value | undefined {
    return this.store.get(key)
  }

  getOrCompute(key: string, fn: () => Value): Value {
    if (!this.has(key)) {
      this.set(key, fn())
    }
    return this.get(key) as Value
  }

  has(key: string): boolean {
    return this.store.has(key)
  }

  set(key: string, value: Value): this {
    this.store.set(key, value)
    return this
  }

  merge(obj: Record<string, Value>, omit: string[] = []): this {
    Object.keys(obj).forEach((key) => {
      if (omit.includes(key)) {
        return
      }

      const value = obj[key]

      if (
        (!Array.isArray(value) && typeof value !== 'object') ||
        value === null ||
        !this.has(key)
      ) {
        this.set(key, value)
      } else {
        this.set(key, merge(this.get(key) as Value, value))
      }
    })

    return this
  }

  clean(obj: Record<string, Value>): Record<string, Value> {
    return Object.keys(obj).reduce(
      (acc: Record<string, Value>, key: string) => {
        const value = obj[key]

        if (value === undefined) {
          return acc
        }

        if (Array.isArray(value) && !value.length) {
          return acc
        }

        if (
          Object.prototype.toString.call(value) === '[object Object]' &&
          !Object.keys(value).length
        ) {
          return acc
        }

        acc[key] = value

        return acc
      },
      {}
    )
  }

  when(
    condition: boolean,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    whenTruthy: (self: this) => void = () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    whenFalsy: (self: this) => void = () => {}
  ): this {
    if (condition) {
      whenTruthy(this)
    } else {
      whenFalsy(this)
    }

    return this
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class ChainedMap<Parent> extends TypedChainedMap<Parent, any> {}
