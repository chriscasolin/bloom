import { TileName } from "../util";
import TileComponent from "./TileComponent";

class Daisy extends TileComponent {
  constructor(variation = 1) {
    // Convert 1-based variation to 0-based for texture lookup
    const textureVariation = variation - 1;
    super(TileName.DAISY, `daisy/daisy_${textureVariation}.png`)
    this.variation = variation
  }
}

export default Daisy;
