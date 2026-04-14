import { TileName } from "../util";
import TileComponent from "./TileComponent";

class Bush extends TileComponent {
  constructor() {
    super(TileName.BUSH, 'bush_outlined.png')
  }
}

export default Bush;
