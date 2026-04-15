/**
 * Centralized asset path configuration
 * All asset paths are defined here to avoid duplication
 */

const publicUrl = process.env.PUBLIC_URL || '';

// Base paths
const TEXTURES = `${publicUrl}/textures`;
const WORLDS = `${publicUrl}/worlds`;

// World files
export const WORLD_PATHS = {
  DEMO: `${WORLDS}/demo.json`,
};

// Item texture paths
export const ITEM_TEXTURES = {
  HAND: 'hand.png',
  LOG: 'items/log_item.png',
  STICK: 'items/stick_item.png',
  LEAVES: 'items/leaves_item.png',
  BERRIES: 'items/berries_item.png',
  CACTUS: 'items/cactus_item.png',
  SAND: 'items/sand_item.png',
  DIRT: 'items/dirt_item.png',
  STONE: 'items/stone_item.png',
  GRANITE: 'items/granite_item.png',
  WHEAT_SEEDS: 'items/wheat_seeds.png',
  SUNFLOWER: 'items/sunflower_item.png',
  DAFFODIL: 'items/daffodil_item.png',
  DAISY: 'items/daisy_item.png',
  TREE: 'tree_outlined.png',
  GRASS: 'grass.png',
  MISSING: 'missing.png',
};

// Tile texture paths
export const TILE_TEXTURES = {
  GRASS: 'tiles/grass.png',
  STONE: 'tiles/stone.png',
  SAND: 'tiles/sand.png',
  WATER_1: 'tiles/water/1/0.png',
  WATER_2: 'tiles/water/2/0.png',
  ITEM_BG: 'items/item_bg.png',
};

// Player texture paths
export const PLAYER_TEXTURES = {
  IDLE: 'player/idle.png',
};

// Images to preload on app startup
export const PRELOAD_IMAGES = [
    ...Object.values(ITEM_TEXTURES).map(filename => `${TEXTURES}/${filename}`),
    ...Object.values(TILE_TEXTURES).map(filename => `${TEXTURES}/${filename}`),
    ...Object.values(PLAYER_TEXTURES).map(filename => `${TEXTURES}/${filename}`),
];

/**
 * Helper function to get item texture path
 * @param {string} itemType - The type of item
 * @returns {string} - The relative texture path
 */
export const getItemTexturePath = (itemType) => {
  switch (itemType) {
    case '__empty__':
      return ITEM_TEXTURES.HAND;
    case 'log':
      return ITEM_TEXTURES.LOG;
    case 'stick':
      return ITEM_TEXTURES.STICK;
    case 'leaves':
      return ITEM_TEXTURES.LEAVES;
    case 'berries':
      return ITEM_TEXTURES.BERRIES;
    case 'cactus':
      return ITEM_TEXTURES.CACTUS;
    case 'sand':
      return ITEM_TEXTURES.SAND;
    case 'dirt':
      return ITEM_TEXTURES.DIRT;
    case 'stone':
      return ITEM_TEXTURES.STONE;
    case 'granite':
      return ITEM_TEXTURES.GRANITE;
    case 'wheat_seeds':
      return ITEM_TEXTURES.WHEAT_SEEDS;
    case 'sunflower':
      return ITEM_TEXTURES.SUNFLOWER;
    case 'daffodil':
      return ITEM_TEXTURES.DAFFODIL;
    case 'daisy':
      return ITEM_TEXTURES.DAISY;
    case 'tree':
      return ITEM_TEXTURES.TREE;
    case 'grass':
      return ITEM_TEXTURES.GRASS;
    default:
      return ITEM_TEXTURES.MISSING;
  }
};
