import { TileName } from "../util";
import TileComponent from "./TileComponent";

class Water extends TileComponent {
  constructor() {
    super(TileName.WATER, 'water/water_.png');
  }
}

export default Water;
