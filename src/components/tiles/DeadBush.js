import { TileName } from "../util";
import TileComponent from "./TileComponent";

class DeadBush extends TileComponent {
  constructor() {
    super(TileName.DEAD_BUSH, 'dead_bush_outlined.png')
  }
}

export default DeadBush;
