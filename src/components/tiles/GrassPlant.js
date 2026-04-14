import { TileName } from "../util";
import TileComponent from "./TileComponent";

class GrassPlant extends TileComponent {
  constructor(variation = 1) {
    super(TileName.GRASS_PLANT, `grass/grass_${variation}.png`)
    this.variation = variation
  }
}

export default GrassPlant;
