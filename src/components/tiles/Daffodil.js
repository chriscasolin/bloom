import { TileName } from "../util";
import TileComponent from "./TileComponent";

class Daffodil extends TileComponent {
  constructor(variation = 1) {
    // Convert 1-based variation to 0-based for texture lookup
    const textureVariation = variation - 1;
    super(TileName.DAFFODIL, `daffodil/daffodil_${textureVariation}.png`)
    this.variation = variation
  }
}

export default Daffodil;
