import { TileName } from "../util";
import TileComponent from "./TileComponent";

class StoneTile extends TileComponent {
  constructor() {
    super(TileName.STONE, 'tiles/stone_tile.png')
  }
}

export default StoneTile;