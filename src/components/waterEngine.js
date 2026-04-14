import { direction, mapKey } from './util';

/**
 * Manages water spreading and propagation
 */
export class WaterEngine {
  constructor() {
    this.spreadQueue = []; // Use array as queue for FIFO ordering
    this.tickCounter = 0;
  }

  /**
   * Mark a tile to begin water spreading
   */
  addWaterSpread(x, y) {
    const key = mapKey(x, y);
    // Avoid duplicates by checking if already in queue
    if (!this.spreadQueue.includes(key)) {
      this.spreadQueue.push(key);
    }
  }

  /**
   * Initialize water spreading from newly created holes
   * Check if the hole is adjacent to water, and if so, start spreading
   */
  checkNewHole(x, y, mapTiles) {
    const cardinals = direction.cardinal();

    // Check if this new hole is adjacent to water
    // If so, add ONE water tile to the queue to spread into this hole
    for (const dir of cardinals) {
      const adjKey = mapKey(x + dir.dx, y + dir.dy);
      const adjTile = mapTiles[adjKey];
      if (adjTile && adjTile.has_water) {
        // Queue the first adjacent water tile and stop
        this.addWaterSpread(x + dir.dx, y + dir.dy);
        return; // Only queue one water source per hole
      }
    }
  }

  /**
   * Spread water from all fronts in the queue per spread tick
   * This creates uniform expansion in all directions
   */
  spreadWater(mapTiles, mapWidth, mapHeight) {
    if (this.spreadQueue.length === 0) {
      return {};
    }

    this.tickCounter++;
    const tileUpdates = {};
    const cardinals = direction.cardinal();
    
    // Get all current fronts (these are the spreading boundaries)
    const currentFronts = [...this.spreadQueue];
    this.spreadQueue = []; // Clear for new tiles to be added

    const newlyFilled = new Set(); // Track newly filled tiles to avoid processing them this tick

    // Process ALL current fronts in this tick
    for (const firstKey of currentFronts) {
      const [xStr, yStr] = firstKey.split('_');
      const x = parseInt(xStr);
      const y = parseInt(yStr);

      const sourceTile = mapTiles[firstKey];
      if (!sourceTile || !sourceTile.has_water) {
        continue;
      }

      // Try to spread to adjacent tiles
      for (const dir of cardinals) {
        const adjX = x + dir.dx;
        const adjY = y + dir.dy;

        // Check bounds
        if (adjX < 0 || adjX >= mapWidth || adjY < 0 || adjY >= mapHeight) {
          continue;
        }

        const adjKey = mapKey(adjX, adjY);
        const adjTile = mapTiles[adjKey];

        if (!adjTile) continue;

        // Water spreads to adjacent holes only, and only if not already filled this tick
        if (adjTile.has_hole && !adjTile.has_water && !adjTile.object && !newlyFilled.has(adjKey)) {
          // Set water on the existing tile
          adjTile.has_water = true;
          newlyFilled.add(adjKey);
          
          // Store reference to the updated tile in tileUpdates
          tileUpdates[adjKey] = adjTile;
          console.log(`[WaterEngine] TICK #${this.tickCounter}: Added water to (${adjX}, ${adjY})`);
        }
      }
    }
    
    // Add all newly filled tiles to queue for next tick
    for (const key of newlyFilled) {
      this.spreadQueue.push(key);
    }

    console.log(`[WaterEngine] Spread from ${currentFronts.length} fronts, filled ${newlyFilled.size} tiles, queue now has ${this.spreadQueue.length} items`);

    return tileUpdates;
  }

  /**
   * Clear the water engine (for new worlds)
   */
  reset() {
    this.spreadQueue = [];
  }
}

