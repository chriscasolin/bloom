import { TileName } from "../util";
import TileComponent from "./TileComponent";

class Cactus extends TileComponent {
  constructor() {
    super(TileName.CACTUS, 'cactus_outlined.png')
  }
}

export default Cactus;
