import { TileName } from "../util";
import TileComponent from "./TileComponent";

class SandTile extends TileComponent {
  constructor() {
    super(TileName.SAND, 'tiles/sand_tile.png');
  }
}

export default SandTile;
