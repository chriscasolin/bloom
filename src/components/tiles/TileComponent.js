class TileComponent {
  constructor(name, texture) {
    this._name = name;
    this._texture = texture;
  }
  get name() {
    return this._name
  }

  get texture() {
    return this._texture
  }
}

export default TileComponent;