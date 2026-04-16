import { useEffect, useRef, useCallback } from "react";
import { BREAK_TIME, direction, KEY, keyCode, mapKey, MAX_TARGET_DISTANCE, MOVEMENT_KEYS, SOLID_OBJECTS, TILE_SIZE, TileName, getTileDrops, getPlacementResult } from "./util";
import Grass from "./tiles/Grass";
import Stone from "./tiles/Stone";
import Sand from "./tiles/Sand";
import { tileFactory } from "./tiles/Tile";

// const MOVE_INTERVAL = 50;
const MOVE_AMOUNT = 0.1;
// const MOVE_AMOUNT = 1;

const Player = ({
  onPlayerUpdate,
  onTileUpdate,
  onItemDrop,
  onItemPickup,
  onSelectItem,
  map,
  position,
  momentum,
  facing,
  inventory,
  targetDistance,
  selected,
  droppedItems,
  showControls
}) => {
  const heldKeys = useRef(new Set());
  const positionRef = useRef(position);
  const momentumRef = useRef(momentum);
  const selectedRef = useRef(selected);
  const inventoryRef = useRef(inventory);
  const droppedItemsRef = useRef(droppedItems);
  const targetDistanceRef = useRef(targetDistance);
  const movementInterval = useRef(null);
  const breakTimeout = useRef(null);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { momentumRef.current = momentum; }, [momentum]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { droppedItemsRef.current = droppedItems; }, [droppedItems]);
  useEffect(() => { targetDistanceRef.current = targetDistance; }, [targetDistance]);

  useEffect(() => {
    let d = 0;
    let x = position.x
    let y = position.y
    let dx = facing.dx
    let dy = facing.dy
    while (d < targetDistance) {
      const key = mapKey(x + d * dx, y + d * dy)
      if (map.tiles[key]?.object && SOLID_OBJECTS.has(map.tiles[key].object.name)) {
        break
      }
      d++
    }
    const offset = 0.2
    const tile = { x: Math.round(x + (d - offset) * dx), y: Math.round(y + (d - offset) * dy) }
    onPlayerUpdate({ selected: tile })
  }, [position, facing, targetDistance, map, onPlayerUpdate])

  const cancelBreak = useCallback(() => {
    onPlayerUpdate({ breakTimer: null })
    clearTimeout(breakTimeout.current);
  }, [onPlayerUpdate]);

  const breakTile = useCallback((tile) => {
    let droppedItems = [];
    
    // If tile has a hole, can break out of it or place something in it instead
    // Water tiles are holes, so they shouldn't be breakable either
    if (tile.has_hole || tile.has_water) {
      return tile;
    }
    
    if (tile.object) {
      const drops = getTileDrops(tile.object.name);
      // For grass plants, use the drops from getTileDrops (wheat_seeds or nothing)
      // For other objects, use drops or fall back to object name
      if (tile.object.name === TileName.GRASS_PLANT) {
        droppedItems = drops;
      } else {
        droppedItems = drops.length > 0 ? drops : [tile.object.name];
      }
      tile.object = null;
    } else if (tile.ground) {
      // Check if this is water - if so, water has already spread
      if (tile.ground.name === TileName.WATER) {
        // Water tiles already have water, just mark as hole
        tile.has_water = false;
        tile.has_hole = true;
      } else {
        // Get drops from ground tile
        const drops = getTileDrops(tile.ground.name);
        droppedItems = drops.length > 0 ? drops : [tile.ground.name];
        tile.has_hole = true;
      }
    }
    
    if (droppedItems.length > 0) {
      const tileKey = mapKey(tile.x, tile.y);
      
      // Drop each item type
      droppedItems.forEach(droppedItem => {
        const existingStack = droppedItemsRef.current.find(item => item.key === tileKey && item.type === droppedItem);
        
        if (existingStack) {
          const updatedStack = { ...existingStack, count: existingStack.count + 1 };
          onItemPickup(existingStack.id);
          onItemDrop(updatedStack);
        } else {
          const randomOffsetX = (Math.random() - 0.5) * TILE_SIZE * 0.4;
          const randomOffsetY = (Math.random() - 0.5) * TILE_SIZE * 0.4;
          
          onItemDrop({
            id: `${tile.x}_${tile.y}_${Date.now()}_${droppedItem}`,
            type: droppedItem,
            key: tileKey,
            tileX: tile.x,
            tileY: tile.y,
            x: tile.x * TILE_SIZE + TILE_SIZE * 0.3 + randomOffsetX,
            y: tile.y * TILE_SIZE + TILE_SIZE * 0.3 + randomOffsetY,
            count: 1
          });
        }
      });
    }
    
    return tile;
  }, [onItemPickup, onItemDrop]);

  const startBreakCallback = useCallback(() => {
    let timer = BREAK_TIME
    onPlayerUpdate({ breakTimer: timer })
    breakTimeout.current = setTimeout(() => {
      let current = selectedRef.current
      let newTile = breakTile(map.tiles[mapKey(current.x, current.y)])
      onTileUpdate({ [mapKey(current.x, current.y)]: newTile })
      onPlayerUpdate({ breakTimer: null })

      if (heldKeys.current.has(KEY.USE)) {
        breakTimeout.current = setTimeout(() => {
          startBreakCallback();
        }, 300)
      }
    }, timer)
  }, [onPlayerUpdate, onTileUpdate, map, breakTile]);

  const placeTile = useCallback(() => {
    if (!inventoryRef.current.selectedType) return;
    
    const selectedItem = inventoryRef.current.selectedType;
    
    // Check if player has this item
    if (!inventoryRef.current.content.includes(selectedItem)) return;
    
    const tileKey = mapKey(selectedRef.current.x, selectedRef.current.y);
    const tile = map.tiles[tileKey];
    if (!tile) return;
    
    console.log('Target tile ground:', tile.ground?.name, 'has_hole:', tile.has_hole, 'has_water:', tile.has_water);
    
    const placementResult = getPlacementResult(selectedItem, tile);
    if (!placementResult) return;
    
    if (placementResult.type === 'fillHole') {
      // Create the appropriate ground tile instance based on the placement ground type
      let groundTile;
      switch (placementResult.groundType) {
        case TileName.GRASS:
          groundTile = new Grass();
          break;
        case TileName.SAND:
          groundTile = new Sand();
          break;
        case TileName.STONE:
          groundTile = new Stone();
          break;
        default:
          groundTile = new Grass();
      }
      
      // Update the current tile instance to fill the hole/water
      tile.ground = groundTile;
      tile.has_hole = false;
      tile.has_water = false;
      tile.object = null;
      
      // Update the placed tile and surrounding tiles for texture rechecking
      const tilesToUpdate = { [tileKey]: tile };
      
      // Also update adjacent tiles so they can recheck their textures (important for water/hole connections)
      const [xStr, yStr] = tileKey.split('_');
      const x = parseInt(xStr);
      const y = parseInt(yStr);
      
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const adjKey = mapKey(x + dx, y + dy);
        const adjTile = map.tiles[adjKey];
        if (adjTile) {
          tilesToUpdate[adjKey] = adjTile;
        }
      }
      
      onTileUpdate(tilesToUpdate);
      
      // Remove only 1 item from inventory (first occurrence)
      const newContent = [...inventoryRef.current.content];
      const index = newContent.indexOf(selectedItem);
      if (index > -1) {
        newContent.splice(index, 1);
      }
      
      const newInventory = { 
        ...inventoryRef.current, 
        content: newContent
      };
      onPlayerUpdate({ inventory: newInventory });
    } else if (placementResult.type === 'placeObject') {
      // Get variation count based on item type
      let variationCount = 0;
      switch (placementResult.objectType) {
        case 'sunflower':
          variationCount = 0; // Sunflower has no variations
          break;
        case 'daffodil':
          variationCount = 2; // Daffodil has 2 variations
          break;
        case 'daisy':
          variationCount = 4; // Daisy has 4 variations
          break;
        default:
          variationCount = 0;
      }
      
      // Choose random variation (or use default if no variations)
      const variation = variationCount > 0 ? Math.floor(Math.random() * variationCount) + 1 : 1;
      
      // Get the tile name from item name
      let tileNameType;
      switch (placementResult.objectType) {
        case 'sunflower':
          tileNameType = TileName.SUNFLOWER;
          break;
        case 'daffodil':
          tileNameType = TileName.DAFFODIL;
          break;
        case 'daisy':
          tileNameType = TileName.DAISY;
          break;
        default:
          tileNameType = TileName.UNKNOWN
      }
      
      // Create proper TileComponent instance using tileFactory
      const tileObj = tileFactory({ type: tileNameType, variation });
      tile.object = tileObj;
      
      const tilesToUpdate = { [tileKey]: tile };
      onTileUpdate(tilesToUpdate);
      
      // Remove only 1 item from inventory (first occurrence)
      const newContent = [...inventoryRef.current.content];
      const index = newContent.indexOf(selectedItem);
      if (index > -1) {
        newContent.splice(index, 1);
      }
      
      const newInventory = { 
        ...inventoryRef.current, 
        content: newContent
      };
      onPlayerUpdate({ inventory: newInventory });
    }
  }, [onTileUpdate, onPlayerUpdate, map]);

  const performAction = useCallback(() => {
    // Try to place the item first
    if (inventoryRef.current.selectedType) {
      const selectedItem = inventoryRef.current.selectedType;
      const tileKey = mapKey(selectedRef.current.x, selectedRef.current.y);
      const tile = map.tiles[tileKey];
      
      if (tile) {
        const placementResult = getPlacementResult(selectedItem, tile);
        if (placementResult) {
          // Item can be placed, do the placement
          placeTile();
          return; // Exit after placing
        }
      }
    }
    
    // If we can't place anything, try to break the tile
    startBreakCallback();
  }, [map, startBreakCallback, placeTile]);

  useEffect(() => {
    let curr = selectedRef.current
    if (selected.x !== curr.x || selected.y !== curr.y) {
      selectedRef.current = selected;
      onPlayerUpdate({ breakTimer: null })
      if (heldKeys.current.has(KEY.USE)) {
        cancelBreak();
        performAction();
      }
    }
  }, [selected, onPlayerUpdate, cancelBreak, performAction])

  const calculateMomentum = () => {
    const keys = heldKeys.current;
    let dx = 0, dy = 0;
    if (keys.has(KEY.NORTH)) dy -= MOVE_AMOUNT;
    if (keys.has(KEY.SOUTH)) dy += MOVE_AMOUNT;
    if (keys.has(KEY.WEST)) dx -= MOVE_AMOUNT;
    if (keys.has(KEY.EAST)) dx += MOVE_AMOUNT;

    if (dx && dy) {
      dx = dx * 0.7
      dy = dy * 0.7
    }

    return { dx, dy };
  };

  const canGo = useCallback((key) => {
    const tile = map.tiles[key];
    if (!tile) return false;
    // Can go through water (but it will be slow), just can't go through solid objects
    return !SOLID_OBJECTS.has(tile.object?.name);
  }, [map]);

  const moveTo = useCallback((x, y) => {
    onPlayerUpdate({ position: { x: x, y: y } });
  }, [onPlayerUpdate]);

  useEffect(() => {
    const playerTileKey = mapKey(Math.round(position.x), Math.round(position.y));
    const itemsAtPosition = droppedItems.filter(item => item.key === playerTileKey);
    
    if (itemsAtPosition.length > 0) {
      const newContent = [...inventoryRef.current.content];
      itemsAtPosition.forEach(item => {
        for (let i = 0; i < item.count; i++) {
          newContent.push(item.type);
        }
        onItemPickup(item.id);
      });
      const newInventory = { ...inventoryRef.current, content: newContent };
      onPlayerUpdate({ inventory: newInventory });
    }
  }, [position.x, position.y, droppedItems, onItemPickup, onPlayerUpdate]);

  const applyMovement = useCallback((delta) => {
    if (!heldKeys.current.has(KEY.STRAFE)) {
      const newDirection = direction.of(calculateMomentum());
      if (newDirection) onPlayerUpdate({ facing: newDirection });
    }

    if (!heldKeys.current.has(KEY.STILL)) {
      const currX = positionRef.current.x
      const currY = positionRef.current.y
      
      // Check if currently in water - apply slow-down
      const currentTile = map.tiles[mapKey(Math.round(currX), Math.round(currY))];
      const movementMultiplier = currentTile?.has_water ? 0.5 : 1.0;
      
      const newX = currX + delta.dx * movementMultiplier;
      const newY = currY + delta.dy * movementMultiplier;

      if (canGo(mapKey(newX, newY))) {
        moveTo(newX, newY)
        // Diagonal position may be blocked, so slide against wall
      } else if (currX !== newX && currY !== newY) { // Prevent uneccesary checks
        if (canGo(mapKey(currX, newY))) {
          moveTo(currX, newY)
        } else if (canGo(mapKey(newX, currY))) {
          moveTo(newX, currY)
        }
      }

    }
  }, [onPlayerUpdate, map, canGo, moveTo]);

  const onMovementKeyDown = useCallback(() => {
    const newMomentum = calculateMomentum();
    onPlayerUpdate({ momentum: newMomentum, isMoving: true });
    
    if (movementInterval.current) {
      cancelAnimationFrame(movementInterval.current);
    }
    
    const animate = () => {
      if (!inventory.open) applyMovement(momentumRef.current);
      movementInterval.current = requestAnimationFrame(animate);
    };
    movementInterval.current = requestAnimationFrame(animate);
  }, [onPlayerUpdate, inventory.open, applyMovement]);

  const onMovementKeyUp = useCallback(() => {
    const newMomentum = calculateMomentum();
    onPlayerUpdate({ momentum: newMomentum });
    if (newMomentum.dx === 0 && newMomentum.dy === 0) {
      cancelAnimationFrame(movementInterval.current);
      movementInterval.current = null;
      onPlayerUpdate({ isMoving: false });
    }
  }, [onPlayerUpdate]);

  const toggleInventory = useCallback(() => {
    const newInventory = { ...inventoryRef.current, open: !inventoryRef.current.open };
    onPlayerUpdate({ inventory: newInventory });
  }, [onPlayerUpdate]);

  const loopTargetDistance = useCallback(() => {
    targetDistanceRef.current = targetDistanceRef.current + 1;
    if (targetDistanceRef.current > MAX_TARGET_DISTANCE) targetDistanceRef.current = 0;
    onPlayerUpdate({ targetDistance: targetDistanceRef.current });
  }, [onPlayerUpdate]);




  const onKeyDown = useCallback((event) => {
    if (showControls) return;
    
    const key = keyCode(event)
    if (heldKeys.current.has(key)) return;
    heldKeys.current.add(key);

    if (key === KEY.INVENTORY) {
      toggleInventory();
    } else if (key === KEY.TARGET_DISTANCE) {
      loopTargetDistance();
    } else if (key === KEY.USE) {
      performAction();
    } else if (key >= '1' && key <= '5' && !inventoryRef.current.open) {
      // Hotbar quick-select: 1-5 selects hotbar items or deselects if empty
      const hotbarSlot = parseInt(key) - 1;
      const hotbarItem = inventoryRef.current.hotbar[hotbarSlot];
      if (hotbarItem) {
        // Only select if not already selected
        if (inventoryRef.current.selectedType !== hotbarItem) {
          onSelectItem(hotbarItem, hotbarSlot);
        }
      } else {
        // If slot is empty, deselect
        onSelectItem(null, hotbarSlot);
      }
    } else if (!inventory.open && MOVEMENT_KEYS.has(key)) {
      onMovementKeyDown(key);
    }
  }, [toggleInventory, loopTargetDistance, performAction, onSelectItem, inventory.open, onMovementKeyDown, showControls]);

  const onKeyUp = useCallback((event) => {
    if (showControls) return;
    
    const key = keyCode(event)
    if (!heldKeys.current.has(key)) return;
    heldKeys.current.delete(key);

    if (key === KEY.USE) {
      cancelBreak();
    } else if (MOVEMENT_KEYS.has(key)) onMovementKeyUp();
  }, [cancelBreak, onMovementKeyUp, showControls]);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  return null;
};

export default Player;