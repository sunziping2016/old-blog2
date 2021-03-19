export default class Chainable<Parent> {
  public readonly parent: Parent

  constructor(parent: Parent) {
    this.parent = parent
  }

  batch(handler: (self: this) => void): this {
    handler(this)
    return this
  }

  end(): Parent {
    return this.parent
  }
}
