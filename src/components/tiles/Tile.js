import { direction, TileName } from "../util";
import Barrier from "./Barrier";
import GrassTile from "./Grass";
import GrassPlant from "./GrassPlant";
import Sunflower from "./Sunflower";
import Daffodil from "./Daffodil";
import Daisy from "./Daisy";
import StoneTile from "./Stone";
import Tree from "./Tree";
import Water from "./Water";
import SandTile from "./Sand";
import Unknown from "./Unknown";
import Cactus from "./Cactus";
import DeadBush from "./DeadBush";
import Bush from "./Bush";
import Granite from "./Granite";

const tileFactory = (element) => {
  if (!element) return null

  switch (element?.type) {
    case TileName.GRASS: return new GrassTile();
    case TileName.GRASS_PLANT: return new GrassPlant(element?.variation || 1);
    case TileName.SUNFLOWER: return new Sunflower();
    case TileName.DAFFODIL: return new Daffodil(element?.variation || 1);
    case TileName.DAISY: return new Daisy(element?.variation || 1);
    case TileName.STONE: return new StoneTile();
    case TileName.BARRIER: return new Barrier();
    case TileName.TREE: return new Tree();
    case TileName.WATER: return new Water();
    case TileName.SAND: return new SandTile();
    case TileName.CACTUS: return new Cactus();
    case TileName.DEAD_BUSH: return new DeadBush();
    case TileName.BUSH: return new Bush();
    case TileName.GRANITE: return new Granite();
    default: return new Unknown(element?.type)
  }
}

export { tileFactory };

const cardinal2letter = (d) => {
  switch (d) {
    case direction.N: return 'n'
    case direction.E: return 'e'
    case direction.S: return 's'
    case direction.W: return 'w'
    default: return null
  }
}

/**
 * Determines which hole texture folder to use based on ground type.
 * This allows for different hole variants (e.g., hole_sand, hole_grass, etc.)
 * Defaults to 'hole' folder for standard holes.
 */
const getHoleFolderByGroundType = (ground) => {
  switch (ground?.name) {
    case TileName.SAND: return 'hole_sand'
    case TileName.STONE: return 'hole_stone'
    default: return 'hole'
  }
}

class Tile {
  constructor(tileObj, key) {
    this.ground = tileFactory(tileObj.ground);
    this.object = tileFactory(tileObj.object);
    this._has_hole = false;
    // Water flag: check explicit water property, ground type, or preserved state
    this._has_water = tileObj.water === true || 
                      tileObj.ground?.type === TileName.WATER ||
                      tileObj._waterState === true;
    this._renderVersion = tileObj._renderVersion || 0;
    [this._x, this._y] = key.split("_").map(s => parseInt(s))
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get has_hole() {
    return this._has_hole
  }

  set has_hole(bool) {
    this._has_hole = bool
  }

  get has_water() {
    return this._has_water
  }

  set has_water(bool) {
    this._has_water = bool;
    // Increment version when water state changes to force re-renders
    this._renderVersion++;
  }

  get renderVersion() {
    return this._renderVersion;
  }

  textures = (adjacentTiles) => {
    let srcFiles = []
    
    // Water takes priority
    if (this._has_water) {
      const adjacentWater = []
      adjacentTiles.forEach(t => {
        // Connect to both water and holes
        if (t.tile.has_water || t.tile.has_hole) {
          adjacentWater.push(cardinal2letter(t.direction))
        }
      });
      const connected_tag = adjacentWater.join('')
      srcFiles.push(`water/1/water_${connected_tag}.png`, `water/2/water_${connected_tag}.png`)
    } else if (this._has_hole) {
      const adjacentHoles = []
      adjacentTiles.forEach(t => {
        // Connect to both holes and water
        if (t.tile.has_hole || t.tile.has_water) {
          adjacentHoles.push(cardinal2letter(t.direction))
        }
      });
      const connected_tag = adjacentHoles.join('')
      const holeFolder = getHoleFolderByGroundType(this.ground)
      srcFiles.push(`${holeFolder}/hole_${connected_tag}.png`)
    }
    
    // Handle object textures - granite gets special treatment for connected textures
    if (this.object) {
      if (this.object.name === TileName.GRANITE) {
        // Granite has connected textures - don't add base texture, add connected version
        const adjacentGranite = []
        adjacentTiles.forEach(t => {
          // Connect to adjacent granite tiles
          if (t.tile.object?.name === TileName.GRANITE) {
            adjacentGranite.push(cardinal2letter(t.direction))
          }
        });
        const connected_tag = adjacentGranite.join('')
        srcFiles.push(`granite/granite_${connected_tag}.png`)
      } else {
        // Other objects render normally
        srcFiles.push(this.object.texture)
      }
    }
    
    // Add ground texture last so it renders underneath
    if (this.ground) {
      srcFiles.push(this.ground.texture)
    }
    
    return srcFiles
  }
}

export default Tile