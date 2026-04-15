import { WORLD_PATHS, getItemTexturePath, PRELOAD_IMAGES } from '../assets/assetPaths';

export const WORLD_FILE = WORLD_PATHS.DEMO;
export { getItemTexturePath, PRELOAD_IMAGES };
export const TILE_SIZE = 50; // px
export const WINDOW_SIZE_X = 16;
export const WINDOW_SIZE_Y = 12;

export const KEY = {
  NORTH: 'arrowup',
  SOUTH: 'arrowdown',
  EAST: 'arrowright',
  WEST: 'arrowleft',
  STILL: 's',
  STRAFE: 'shift',
  USE: ' ',
  INTERACT: 'x',
  INVENTORY: 'e',
  TARGET_DISTANCE: 'a'
}

export const InventoryKeybinds = {
  // Navigation
  navigateUp: 'arrowup',
  navigateDown: 'arrowdown',
  navigateLeft: 'arrowleft',
  navigateRight: 'arrowright',

  // Selection
  select: ' ',
  deselectCurrent: 'escape'
};

export const TileName = {
  NONE: 'none',
  GRASS: 'grass',
  GRASS_PLANT: 'grass_plant',
  SUNFLOWER: 'sunflower',
  DAFFODIL: 'daffodil',
  DAISY: 'daisy',
  STONE: 'stone',
  BARRIER: 'barrier',
  TREE: 'tree',
  HOLE: 'hole',
  WATER: 'water',
  SAND: 'sand',
  CACTUS: 'cactus',
  DEAD_BUSH: 'dead_bush',
  BUSH: 'bush',
  GRANITE: 'granite',
  UNKNOWN: 'unknown'
}

export const ItemName = {
  LOG: 'log',
  STICK: 'stick',
  LEAVES: 'leaves',
  BERRIES: 'berries',
  CACTUS: 'cactus',
  SAND: 'sand',
  DIRT: 'dirt',
  STONE: 'stone',
  GRANITE: 'granite',
  WHEAT_SEEDS: 'wheat_seeds',
  SUNFLOWER: 'sunflower',
  DAFFODIL: 'daffodil',
  DAISY: 'daisy'
}

export class direction {
  static N = { dx: 0, dy: -1 }
  static S = { dx: 0, dy: 1 }
  static W = { dx: -1, dy: 0 }
  static E = { dx: 1, dy: 0 }
  static NW = { dx: -1, dy: -1 }
  static NE = { dx: 1, dy: -1 }
  static SW = { dx: -1, dy: 1 }
  static SE = { dx: 1, dy: 1 }

  static of(d) {
    if (d.dx === 0 && d.dy < 0) return direction.N;
    if (d.dx === 0 && d.dy > 0) return direction.S;
    if (d.dx < 0 && d.dy === 0) return direction.W;
    if (d.dx > 0 && d.dy === 0) return direction.E;
    if (d.dx < 0 && d.dy < 0) return direction.NW;
    if (d.dx > 0 && d.dy < 0) return direction.NE;
    if (d.dx < 0 && d.dy > 0) return direction.SW;
    if (d.dx > 0 && d.dy > 0) return direction.SE;
    return direction.S;
  }

  static cardinal() {
    return [
      direction.N,
      direction.E,
      direction.S,
      direction.W
    ]
  }
}

export const INITIAL_DIRECTION = direction.S;
export const INITIAL_POSITION = { x: 0, y: 0 }

export const link = (filename) => `url('textures/${filename}')`

export const playerDirectionAsset = (d) => {
  switch (d) {
    case direction.N:
      return link('player/player_n.png')
    case direction.S:
      return link('player/player_s.png')
    case direction.W:
      return link('player/player_w.png')
    case direction.E:
      return link('player/player_e.png')
    case direction.NW:
      return link('player/player_nw.png')
    case direction.NE:
      return link('player/player_ne.png')
    case direction.SW:
      return link('player/player_sw.png')
    case direction.SE:
      return link('player/player_se.png')
    default:
      return link('missing.png')
  }
}

export const SOLID_OBJECTS = new Set([TileName.BARRIER, TileName.TREE, TileName.CACTUS, TileName.GRANITE])
// export const SOLID_OBJECTS = new Set([TileName.BARRIER]) // empty for testing
export const WATER_SPREADING_INTERVAL = 500; // ms between water spread ticks
export const mapKey = (x, y) => `${Math.round(x)}_${Math.round(y)}`

export const MOVEMENT_KEYS = new Set([KEY.NORTH, KEY.SOUTH, KEY.EAST, KEY.WEST]);

export const keyCode = (event) => event.key.toLowerCase()

export const target_coord = (position, facing, target_distance) => {
  let target_x = position.x + target_distance * facing.dx
  let target_y = position.y + target_distance * facing.dy
  return { x: target_x, y: target_y }
}

export const MAX_TARGET_DISTANCE = 1;

export const BREAK_TIME = 300;

/**
 * Get the items that drop from breaking a tile
 * Returns an array of item types that should be dropped
 */
export const getTileDrops = (tileName) => {
  switch (tileName) {
    case TileName.TREE:
      return [ItemName.LOG, ItemName.STICK, ItemName.LEAVES];
    case TileName.BUSH:
      return [ItemName.STICK, ItemName.BERRIES];
    case TileName.CACTUS:
      return [ItemName.CACTUS];
    case TileName.SAND:
      return [ItemName.SAND];
    case TileName.GRASS:
      // GrassTile always drops dirt
      return [ItemName.DIRT];
    case TileName.GRASS_PLANT:
      // GrassPlant has 1/3 chance to drop wheat_seeds, otherwise drop nothing
      return Math.random() < 1 / 3 ? [ItemName.WHEAT_SEEDS] : [];
    case TileName.SUNFLOWER:
      return [ItemName.SUNFLOWER];
    case TileName.DAFFODIL:
      return [ItemName.DAFFODIL];
    case TileName.DAISY:
      return [ItemName.DAISY];
    case TileName.STONE:
      return [ItemName.STONE];
    case TileName.DEAD_BUSH:
      return [ItemName.STICK];
    case TileName.GRANITE:
      return [ItemName.GRANITE];
    default:
      return [];
  }
};

/**
 * Get the texture path for an item type
 */
export const getItemTexture = (itemType) => {
  return getItemTexturePath(itemType);
};

/**
 * Placement rules - defines what items can be placed and where
 * Each entry maps from an item type to its placement rules
 * 
 * Placement options:
 * - fillHole: if true, can fill holes with this material (becomes the ground tile)
 * - placeOnTop: if true, can place this as an object on certain tiles
 */
export const PlacementRules = {
  'dirt': {
    fillHole: true,
    placeOnTop: false
  },
  'sand': {
    fillHole: true,
    placeOnTop: false
  },
  'stone': {
    fillHole: true,
    placeOnTop: false
  },
  'sunflower': {
    fillHole: false,
    placeOnTop: true,
    onlyOnGrass: true
  },
  'daffodil': {
    fillHole: false,
    placeOnTop: true,
    onlyOnGrass: true
  },
  'daisy': {
    fillHole: false,
    placeOnTop: true,
    onlyOnGrass: true
  }
};

/**
 * Check if an item can be placed and what action it performs
 * Returns the placement result or null if placement isn't allowed
 */
export const getPlacementResult = (itemType, tile) => {
  const rules = PlacementRules[itemType];
  if (!rules) return null;

  // Can fill holes or water with the fillHole items
  if (rules.fillHole && (tile.has_hole || tile.has_water)) {
    console.log('Filling hole/water on tile with ground:', tile.ground?.name, 'has_hole:', tile.has_hole, 'has_water:', tile.has_water);
    return {
      type: 'fillHole',
      groundType: itemType === 'dirt' ? TileName.GRASS : (itemType === 'sand' ? TileName.SAND : TileName.STONE)
    };
  }

  // Can place flowers on grass tiles
  if (rules.placeOnTop && rules.onlyOnGrass && tile.ground?.name === TileName.GRASS && !tile.object) {
    return {
      type: 'placeObject',
      objectType: itemType
    };
  }

  return null;
};
