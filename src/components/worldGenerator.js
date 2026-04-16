import { TileName, mapKey } from './util';

/**
 * Biome definition system
 * Each biome defines its characteristics and rules for feature placement
 * 
 * To add a new biome:
 * 1. Add it to BiomeTypes
 * 2. Add its definition to BiomeDefinitions with ground type, water flag, and features
 * 3. Update getBiomeAtPoint() to include the noise threshold
 */
const BiomeTypes = {
  PLAINS: 'plains',
  SAND: 'sand',
  OCEAN: 'ocean',
  FOREST: 'forest'
};

const BiomeDefinitions = {
  [BiomeTypes.PLAINS]: {
    name: 'Plains',
    groundType: TileName.GRASS,
    features: {
      trees: { enabled: true, clusterSize: 1, probability: 2 },
      stones: { enabled: true, clusterSize: 6, probability: 0.30 },
      bushes: { enabled: true, clusterSize: 3, probability: 0.28 },
      grassPlants: { enabled: true, clusterSize: 5, probability: 1.5 },
      sunflowers: { enabled: true, clusterSize: 2, probability: 1 },
      daffodils: { enabled: true, clusterSize: 1, probability: 1.5 },
      daisies: { enabled: true, clusterSize: 1, probability: 1.5 }
    }
  },
  [BiomeTypes.SAND]: {
    name: 'Sand',
    groundType: TileName.SAND,
    features: {
      trees: { enabled: false },
      stones: { enabled: true, clusterSize: 5, probability: 0.20 },
      cacti: { enabled: true, clusterSize: 2, probability: 1 },
      deadBushes: { enabled: true, clusterSize: 3, probability: 0.16 }
    }
  },
  [BiomeTypes.OCEAN]: {
    name: 'Ocean',
    groundType: TileName.SAND,
    features: {
      trees: { enabled: false },
      stones: { enabled: false }
    }
  },
  [BiomeTypes.FOREST]: {
    name: 'Forest',
    groundType: TileName.GRASS,
    features: {
      trees: { enabled: true, clusterSize: 8, probability: 1.2 },
      stones: { enabled: true, clusterSize: 6, probability: 0.15 },
      bushes: { enabled: true, clusterSize: 3, probability: 0.35 },
      grassPlants: { enabled: true, clusterSize: 5, probability: 1.2 },
      sunflowers: { enabled: true, clusterSize: 2, probability: 1 },
      daffodils: { enabled: true, clusterSize: 1, probability: 1.5 },
      daisies: { enabled: true, clusterSize: 1, probability: 1.5 }
    }
  }
};

// Hash based noise function
const hashNoise = (x, y, seed = 0) => {
  const n = Math.sin(x * 73.156 + y * 94.673 + seed) * 45758.5453;
  return n - Math.floor(n);
};

// Interpolation function for smoother noise transitions
const smoothstep = (t) => t * t * (3 - 2 * t);

// Perlin-like noise with interpolation
const perlinNoise = (x, y, seed = 0) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  
  const n00 = hashNoise(xi, yi, seed);
  const n10 = hashNoise(xi + 1, yi, seed);
  const n01 = hashNoise(xi, yi + 1, seed);
  const n11 = hashNoise(xi + 1, yi + 1, seed);
  
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  
  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
};

// Multi-octave noise map with better variation
const generateNoiseMap = (width, height, scale = 60, seed = 0, octaves = 4) => {
  const noiseMap = {};
  const secondaryNoiseMap = {};
  const oceanNoiseMap = {};
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Primary noise for main biome distribution
      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;
      
      for (let i = 0; i < octaves; i++) {
        const sampleX = (x / scale) * frequency;
        const sampleY = (y / scale) * frequency;
        value += perlinNoise(sampleX, sampleY, seed + i) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      // Secondary noise for deserts
      let secondaryValue = 0;
      amplitude = 1;
      frequency = 1;
      maxValue = 0;
      
      for (let i = 0; i < 3; i++) {
        const sampleX = (x / (scale * 2)) * frequency;
        const sampleY = (y / (scale * 2)) * frequency;
        secondaryValue += perlinNoise(sampleX, sampleY, seed + 1000 + i) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      // Tertiary noise for oceans. independent
      let oceanValue = 0;
      amplitude = 1;
      frequency = 1;
      maxValue = 0;
      
      for (let i = 0; i < 2; i++) {
        const sampleX = (x / (scale * 2.5)) * frequency;
        const sampleY = (y / (scale * 2.5)) * frequency;
        oceanValue += perlinNoise(sampleX, sampleY, seed + 2000 + i) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      noiseMap[mapKey(x, y)] = value / maxValue;
      secondaryNoiseMap[mapKey(x, y)] = secondaryValue / maxValue;
      oceanNoiseMap[mapKey(x, y)] = oceanValue / maxValue;
    }
  }
  
  return { noiseMap, secondaryNoiseMap, oceanNoiseMap };
};

// Determines biome type based on three independent noise maps
// Each dimension controls a different biome independently
const getBiomeAtPoint = (noiseValue, desertNoise = 0, oceanNoise = 0) => {
  // Check ocean noise first - completely independent dimension
  if (oceanNoise < 0.4) return BiomeTypes.OCEAN;
  
  // Check desert noise - also completely independen
  if (desertNoise < 0.40) return BiomeTypes.SAND;
  
  // Use primary noise for plains vs forest distribution
  if (noiseValue < 0.65) return BiomeTypes.PLAINS;
  return BiomeTypes.FOREST;
};

/**
 * Seeded random number generator for reproducible worlds
 */
const seededRandom = (seed) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

// Places features based on biome definitions
const placeFeatures = (tiles, biomeTiles, width, height, random) => {
  // Helper function to place a specific feature type
  const placeFeatureType = (biomeType, biomeDef, featureKey, tileNameType) => {
    if (!biomeDef.features[featureKey] || !biomeDef.features[featureKey].enabled) return;
    
    const numClusters = Math.floor((width * height / 200) * biomeDef.features[featureKey].probability);
    
    for (let c = 0; c < numClusters; c++) {
      const centerX = Math.floor(random() * (width - 10)) + 5;
      const centerY = Math.floor(random() * (height - 10)) + 5;
      
      const centerKey = mapKey(centerX, centerY);
      if (biomeTiles[centerKey] !== biomeType) continue;
      
      const clusterSize = biomeDef.features[featureKey].clusterSize;
      
      for (let dy = -clusterSize; dy <= clusterSize; dy++) {
        for (let dx = -clusterSize; dx <= clusterSize; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
            const key = mapKey(x, y);
            
            // Stay within biome
            if (biomeTiles[key] !== biomeType) continue;
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const probability = Math.max(0, 1 - distance / clusterSize);
            
            // Different fill probabilities for different features
            const fillProb = featureKey === 'stones' ? 1.3 : 0.6;
            
            if (random() < probability * fillProb && !tiles[key].object && !tiles[key].water) {
              // Stones are base tiles, others are objects on top of ground
              if (featureKey === 'stones') {
                tiles[key] = {
                  ground: { type: tileNameType }
                };
              } else if (featureKey === 'grassPlants') {
                // Grass plants have 6 variations and only grow on grass, not stone
                if (tiles[key].ground?.type !== TileName.STONE) {
                  const variation = Math.floor(random() * 6) + 1;
                  tiles[key] = {
                    ground: tiles[key].ground,
                    object: { type: tileNameType, variation }
                  };
                }
              } else if (featureKey === 'sunflowers') {
                // Sunflowers have no variations
                if (tiles[key].ground?.type !== TileName.STONE) {
                  tiles[key] = {
                    ground: tiles[key].ground,
                    object: { type: tileNameType }
                  };
                }
              } else if (featureKey === 'daffodils') {
                // Daffodils have 2 variations
                if (tiles[key].ground?.type !== TileName.STONE) {
                  const variation = Math.floor(random() * 2) + 1;
                  tiles[key] = {
                    ground: tiles[key].ground,
                    object: { type: tileNameType, variation }
                  };
                }
              } else if (featureKey === 'daisies') {
                // Daisies have 4 variations
                if (tiles[key].ground?.type !== TileName.STONE) {
                  const variation = Math.floor(random() * 4) + 1;
                  tiles[key] = {
                    ground: tiles[key].ground,
                    object: { type: tileNameType, variation }
                  };
                }
              } else {
                tiles[key] = {
                  ground: tiles[key].ground,
                  object: { type: tileNameType }
                };
              }
            }
          }
        }
      }
    }
  };

  // Place features for each biome
  for (const [biomeType, biomeDef] of Object.entries(BiomeDefinitions)) {
    placeFeatureType(biomeType, biomeDef, 'trees', TileName.TREE);
    placeFeatureType(biomeType, biomeDef, 'stones', TileName.STONE);
    placeFeatureType(biomeType, biomeDef, 'bushes', TileName.BUSH);
    placeFeatureType(biomeType, biomeDef, 'cacti', TileName.CACTUS);
    placeFeatureType(biomeType, biomeDef, 'deadBushes', TileName.DEAD_BUSH);
    placeFeatureType(biomeType, biomeDef, 'grassPlants', TileName.GRASS_PLANT);
    placeFeatureType(biomeType, biomeDef, 'sunflowers', TileName.SUNFLOWER);
    placeFeatureType(biomeType, biomeDef, 'daffodils', TileName.DAFFODIL);
    placeFeatureType(biomeType, biomeDef, 'daisies', TileName.DAISY);
  }
};

// Places granite overlays on stone tiles
// Granite appears on some tiles within stone deposits with connected textures
const placeGranite = (tiles, width, height, random) => {
  // Iterate through all tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = mapKey(x, y);
      const tile = tiles[key];
      
      // Only place granite on stone tiles
      if (tile.ground?.type === TileName.STONE && !tile.object && !tile.water) {
        // Granite spawns on about 40-60% of stone tiles
        if (random() < 0.8) {
          tile.object = { type: TileName.GRANITE };
        }
      }
    }
  }
};

/**
 * Places lakes as water features using flood-fill algorithm
 */
const placeLakes = (tiles, biomeTiles, width, height, random, numLakes = 4) => {
  for (let lakeNum = 0; lakeNum < numLakes; lakeNum++) {
    // Find random water or sand biome location for lake center
    let centerX, centerY, attempts = 0;
    let isValidSpot = false;
    
    while (!isValidSpot && attempts < 50) {
      centerX = Math.floor(random() * (width - 20)) + 10;
      centerY = Math.floor(random() * (height - 20)) + 10;
      const centerKey = mapKey(centerX, centerY);
      const biome = biomeTiles[centerKey];
      
      // Lakes can form in water/sand transition zones
      isValidSpot = (biome === BiomeTypes.OCEAN || biome === BiomeTypes.SAND || biome === BiomeTypes.PLAINS);
      attempts++;
    }
    
    if (!isValidSpot) continue;
    
    // Expand lake using flood-fill
    const lakeRadius = 3 + Math.floor(random() * 3); // 3-5 tiles radius
    const waterTiles = new Set();
    const toProcess = [[centerX, centerY]];
    
    while (toProcess.length > 0) {
      const [x, y] = toProcess.shift();
      const key = mapKey(x, y);
      
      if (waterTiles.has(key)) continue;
      
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Probabilistic expansion - core is always water, edges fade out
      const shouldPlace = random() < (1 - distance / (lakeRadius + 1.5));
      
      if (shouldPlace && distance <= lakeRadius + 1.5) {
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          waterTiles.add(key);
          tiles[key] = {
            ground: { type: TileName.SAND },
            water: true
          };
          
          // Add orthogonal neighbors to process queue
          toProcess.push([x - 1, y]);
          toProcess.push([x + 1, y]);
          toProcess.push([x, y - 1]);
          toProcess.push([x, y + 1]);
        }
      }
    }
    
    // Add sand beaches around lake
    const beachTiles = new Set();
    for (const waterKey of waterTiles) {
      const [xStr, yStr] = waterKey.split('_');
      const wx = parseInt(xStr);
      const wy = parseInt(yStr);
      
      // Check orthogonal neighbors
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const bx = wx + dx;
        const by = wy + dy;
        const bKey = mapKey(bx, by);
        
        if (bx > 0 && bx < width - 1 && by > 0 && by < height - 1) {
          if (!waterTiles.has(bKey) && !beachTiles.has(bKey)) {
            beachTiles.add(bKey);
            if (tiles[bKey].ground.type === TileName.GRASS && !tiles[bKey].object) {
              tiles[bKey] = {
                ground: { type: TileName.SAND }
              };
            }
          }
        }
      }
    }
  }
};

/**
 * Places small islands inside ocean biomes with random chance
 */
const placeIslands = (tiles, biomeTiles, width, height, random) => {
  // Scan the world for ocean tiles and randomly create islands
  const oceanTiles = [];
  
  // First pass: find all ocean tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = mapKey(x, y);
      if (biomeTiles[key] === BiomeTypes.OCEAN) {
        oceanTiles.push({ x, y, key });
      }
    }
  }
  
  // Second pass: randomly select ocean tiles as island centers
  const islandCenters = new Set();
  const islandProbability = 0.001; // ~0.1% of ocean tiles become island centers
  
  for (const tile of oceanTiles) {
    if (random() < islandProbability) {
      // Validate it's surrounded by ocean (not near edges)
      let isSurroundedByOcean = true;
      for (let dy = -5; dy <= 5; dy += 2) {
        for (let dx = -5; dx <= 5; dx += 2) {
          const checkX = tile.x + dx;
          const checkY = tile.y + dy;
          if (checkX > 0 && checkX < width - 1 && checkY > 0 && checkY < height - 1) {
            const checkKey = mapKey(checkX, checkY);
            if (biomeTiles[checkKey] !== BiomeTypes.OCEAN) {
              isSurroundedByOcean = false;
              break;
            }
          }
        }
        if (!isSurroundedByOcean) break;
      }
      
      if (isSurroundedByOcean) {
        islandCenters.add(tile.key);
      }
    }
  }
  
  // Third pass: create islands from centers
  for (const centerKey of islandCenters) {
    const [xStr, yStr] = centerKey.split('_');
    const centerX = parseInt(xStr);
    const centerY = parseInt(yStr);
    
    // Create island using flood-fill
    const islandRadius = 2 + Math.floor(random() * 2); // 2-3 tiles radius for cute small islands
    const islandTiles = new Set();
    const toProcess = [[centerX, centerY]];
    
    while (toProcess.length > 0) {
      const [x, y] = toProcess.shift();
      const key = mapKey(x, y);
      
      if (islandTiles.has(key)) continue;
      
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Island is solid in the center, edges fade out
      const shouldPlace = random() < (1 - distance / (islandRadius + 0.8));
      
      if (shouldPlace && distance <= islandRadius + 0.8) {
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          islandTiles.add(key);
          
          // Island ground is grass, sand beaches on edges
          const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          tiles[key] = {
            ground: { type: distanceFromCenter <= islandRadius - 0.5 ? TileName.GRASS : TileName.SAND }
          };
          biomeTiles[key] = BiomeTypes.PLAINS; // Mark as land biome
          
          // Add orthogonal neighbors to process queue
          toProcess.push([x - 1, y]);
          toProcess.push([x + 1, y]);
          toProcess.push([x, y - 1]);
          toProcess.push([x, y + 1]);
        }
      }
    }
    
    // Add sand beaches around the island
    const beachTiles = new Set();
    for (const islandKey of islandTiles) {
      const [xStr, yStr] = islandKey.split('_');
      const ix = parseInt(xStr);
      const iy = parseInt(yStr);
      
      // Check all 8 neighbors for beach placement
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const bx = ix + dx;
          const by = iy + dy;
          const bKey = mapKey(bx, by);
          
          if (bx > 0 && bx < width - 1 && by > 0 && by < height - 1) {
            if (!islandTiles.has(bKey) && !beachTiles.has(bKey)) {
              beachTiles.add(bKey);
              // Add sand beach around island
              if (biomeTiles[bKey] === BiomeTypes.OCEAN) {
                tiles[bKey] = {
                  ground: { type: TileName.SAND }
                };
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Places natural beaches along ocean coastlines
 */
const placeBeaches = (tiles, biomeTiles, width, height, random) => {
  const beachesToPlace = new Set();
  
  // Scan for ocean-to-land transitions
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const key = mapKey(x, y);
      const biome = biomeTiles[key];
      
      // Look for coastlines - ocean adjacent to non-ocean
      if (biome === BiomeTypes.OCEAN) {
        let isCoastline = false;
        
        // Check orthogonal neighbors
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nKey = mapKey(x + dx, y + dy);
          if (biomeTiles[nKey] !== BiomeTypes.OCEAN) {
            isCoastline = true;
            break;
          }
        }
        
        // If coastline, place beach
        if (isCoastline) {
          beachesToPlace.add(key);
        }
      }
    }
  }
  
  // Expand beaches 2-3 tiles wide from coastlines with natural irregular inner edges
  const beaches = new Set();
  for (const coastKey of beachesToPlace) {
    const [xStr, yStr] = coastKey.split('_');
    const cx = parseInt(xStr);
    const cy = parseInt(yStr);
    
    const beachWidth = 2 + Math.floor(random() * 2); // 2-3 tiles wide
    const toProcess = [[cx, cy]];
    const processed = new Set();
    let depth = 0;
    
    while (toProcess.length > 0 && depth < beachWidth) {
      const newProcess = [];
      
      for (const [x, y] of toProcess) {
        const key = mapKey(x, y);
        if (processed.has(key)) continue;
        processed.add(key);
        
        // Mark as beach if it's ocean and not already modified
        if (biomeTiles[key] === BiomeTypes.OCEAN && !beaches.has(key)) {
          beaches.add(key);
          
          // Only expand orthogonally to keep water edge clean
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = x + dx;
            const ny = y + dy;
            const nKey = mapKey(nx, ny);
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !processed.has(nKey)) {
              newProcess.push([nx, ny]);
            }
          }
        }
      }
      
      toProcess.length = 0;
      toProcess.push(...newProcess);
      depth++;
    }
  }
  
  // Apply beaches - keep sand ground but mark for visual distinction if needed
  for (const beachKey of beaches) {
    // Beaches are already sand from ocean biome, just ensure they're empty (no water overlay)
    if (tiles[beachKey]) {
      tiles[beachKey] = {
        ground: { type: TileName.SAND }
      };
    }
  }
};

/**
 * Validates that all biomes exist in the world
 * Returns true if world has at least one tile of each biome
 */
const validateAllBiomesExist = (biomeTiles) => {
  const biomesFound = new Set();
  
  for (const biome of Object.values(biomeTiles)) {
    biomesFound.add(biome);
  }
  
  // Check if all 4 biomes are present
  const requiredBiomes = Object.values(BiomeTypes);
  for (const biome of requiredBiomes) {
    if (!biomesFound.has(biome)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Finds a suitable spawn point using BFS from world center
 */
const findSpawnPoint = (tiles, width, height) => {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  let spawnX = centerX;
  let spawnY = centerY;
  
  const visited = new Set();
  const queue = [[centerX, centerY]];
  visited.add(mapKey(centerX, centerY));
  
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const key = mapKey(x, y);
    
    if (tiles[key] && 
        tiles[key].ground.type === TileName.GRASS && 
        !tiles[key].object && 
        !tiles[key].water) {
      spawnX = x;
      spawnY = y;
      break;
    }
    
    const neighbors = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
    for (const [nx, ny] of neighbors) {
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
        const nKey = mapKey(nx, ny);
        if (!visited.has(nKey)) {
          visited.add(nKey);
          queue.push([nx, ny]);
        }
      }
    }
  }
  
  return { x: spawnX, y: spawnY };
};

/**
 * Generates a large world with multiple biomes
 * Regenerates if not all biomes are present in the world
 */
export const generateBiomeWorld = (width, height, options = {}) => {
  const {
    scale = 60,
    octaves = 4
  } = options;

  const MAX_RETRIES = 20;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const seed = Math.floor(Math.random() * 1000000);
    const random = seededRandom(seed);
    const tiles = {};
    const biomeTiles = {};

    // Generate noise maps for biome placement
    const { noiseMap, secondaryNoiseMap, oceanNoiseMap } = generateNoiseMap(width, height, scale, seed, octaves);
    
    // Assign biomes to each tile and create base ground
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = mapKey(x, y);
        const noiseValue = noiseMap[key];
        const desertNoise = secondaryNoiseMap[key];
        const oceanNoise = oceanNoiseMap[key];
        const biomeType = getBiomeAtPoint(noiseValue, desertNoise, oceanNoise);
        const biomeDef = BiomeDefinitions[biomeType];
        
        biomeTiles[key] = biomeType;
        
        // Create base ground tile
        tiles[key] = {
          ground: { type: biomeDef.groundType }
        };
        
        // Add water if ocean biome
        if (biomeType === BiomeTypes.OCEAN) {
          tiles[key].water = true;
        }
      }
    }

    // Check if all biomes are present - if not, regenerate
    if (!validateAllBiomesExist(biomeTiles)) {
      attempt++;
      continue;
    }

    // Place biome-specific features
    placeFeatures(tiles, biomeTiles, width, height, random);

    // Place lakes as additional water features
    placeLakes(tiles, biomeTiles, width, height, random, 10);

    // Place cute little islands in oceans with random chance
    placeIslands(tiles, biomeTiles, width, height, random);

    // Place natural beaches along ocean coastlines
    placeBeaches(tiles, biomeTiles, width, height, random);

    // Place granite overlays on stone deposits
    placeGranite(tiles, width, height, random);

    // Place borders
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          const key = mapKey(x, y);
          tiles[key] = {
            ground: { type: TileName.GRASS },
            object: { type: TileName.BARRIER }
          };
        }
      }
    }

    // Find suitable spawn point
    const spawnPos = findSpawnPoint(tiles, width, height);

    return {
      tiles,
      biomeTiles,
      size: { x: width, y: height },
      position: spawnPos
    };
  }

  // Fallback: return a world even if validation fails after max retries
  console.warn(`Failed to generate world with all biomes after ${MAX_RETRIES} attempts. Returning partial world.`);
  const seed = Math.floor(Math.random() * 1000000);
  const random = seededRandom(seed);
  const tiles = {};
  const biomeTiles = {};

  const { noiseMap, secondaryNoiseMap, oceanNoiseMap } = generateNoiseMap(width, height, scale, seed, octaves);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = mapKey(x, y);
      const noiseValue = noiseMap[key];
      const desertNoise = secondaryNoiseMap[key];
      const oceanNoise = oceanNoiseMap[key];
      const biomeType = getBiomeAtPoint(noiseValue, desertNoise, oceanNoise);
      const biomeDef = BiomeDefinitions[biomeType];
      
      biomeTiles[key] = biomeType;
      tiles[key] = {
        ground: { type: biomeDef.groundType }
      };
      
      if (biomeType === BiomeTypes.OCEAN) {
        tiles[key].water = true;
      }
    }
  }

  placeFeatures(tiles, biomeTiles, width, height, random);
  placeLakes(tiles, biomeTiles, width, height, random, 10);
  placeIslands(tiles, biomeTiles, width, height, random);
  placeBeaches(tiles, biomeTiles, width, height, random);
  placeGranite(tiles, width, height, random);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        const key = mapKey(x, y);
        tiles[key] = {
          ground: { type: TileName.GRASS },
          object: { type: TileName.BARRIER }
        };
      }
    }
  }

  const spawnPos = findSpawnPoint(tiles, width, height);

  return {
    tiles,
    biomeTiles,
    size: { x: width, y: height },
    position: spawnPos
  };
};

/**
 * Generates a random world with the specified dimension
 */
export const generateRandomWorld = (width, height, options = {}) => {
  const {
    barrierOnEdges = true,
    // seed = null
  } = options;

  const tiles = {};

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = mapKey(x, y);
      
      let objectType = null;

      if (barrierOnEdges && (x === 0 || x === width - 1 || y === 0 || y === height - 1)) {
        objectType = TileName.BARRIER;
      }

      const tileData = {
        ground: { type: TileName.GRASS }
      };

      if (objectType) {
        tileData.object = { type: objectType };
      }
      
      tiles[key] = tileData;
    }
  }

  let spawnX = Math.floor(width / 2);
  let spawnY = Math.floor(height / 2);

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = spawnX + dx;
      const y = spawnY + dy;
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        const k = mapKey(x, y);
        tiles[k] = {
          ground: { type: TileName.GRASS }
        };
      }
    }
  }

  return {
    tiles,
    size: { x: width, y: height },
    position: { x: spawnX, y: spawnY }
  };
};

// Gets a world by name or generates a new one
export const getWorld = async (worldName = 'demo') => {
  if (worldName === 'random') {
    return generateBiomeWorld(200, 200);
  }

  try {
    const response = await fetch(`/worlds/${worldName}.json`);
    return response.json();
  } catch (error) {
    console.error(`Failed to load world ${worldName}, generating biome world instead`, error);
    return generateBiomeWorld(200, 200);
  }
};

/**
 * Gets the biome name at a specific position
 * Used for debug UI and other queries
 */
export const getBiomeAtPosition = (x, y, biomeTiles) => {
  const key = mapKey(x, y);
  const biomeType = biomeTiles[key];
  return BiomeDefinitions[biomeType]?.name || 'Unknown';
};
