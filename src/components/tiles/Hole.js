import { TileName } from "../util";
import TileComponent from "./TileComponent";

class Hole extends TileComponent {
  constructor() {
      super(TileName.HOLE, 'missing.png')
    }
}

export default Hole;