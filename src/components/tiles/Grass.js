import { TileName } from "../util";
import TileComponent from "./TileComponent";

class GrassTile extends TileComponent {
  constructor() {
    super(TileName.GRASS, 'tiles/grass_tile.png')
  }
}

export default GrassTile;