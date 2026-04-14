import { useEffect, useState, useRef } from "react";
import MapWindow from "./MapWindow";
import Player from "./Player";
import DebugUI from "./DebugUI";
import { INITIAL_DIRECTION, MAX_TARGET_DISTANCE, WORLD_FILE, WATER_SPREADING_INTERVAL } from "./util";
import Tile from "./tiles/Tile";
import { getWorld, getBiomeAtPosition } from "./worldGenerator";
import { WaterEngine } from "./waterEngine";

const parseMap = (mapObj) => {
  // console.log(mapObj.tiles)
  let tiles = Object
    .fromEntries(Object
      .entries(mapObj.tiles)
      .map(([k, tileObj]) => {
        const newTile = new Tile(tileObj, k);
        // Preserve water state if it exists on the old tile object
        if (tileObj.water !== undefined) {
          newTile.has_water = tileObj.water;
        }
        return [k, newTile];
      }))
  mapObj.tiles = tiles
  return mapObj
}

const Game = () => {
  const [map, setMap] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [droppedItems, setDroppedItems] = useState([]);
  const [currentWorld, setCurrentWorld] = useState('demo');
  const [biomeTiles, setBiomeTiles] = useState(null);
  const waterEngineRef = useRef(new WaterEngine());
  const waterSpreadIntervalRef = useRef(null);
  const mapRef = useRef(null);

  // Keep map ref in sync
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  // Load world on mount
  useEffect(() => {
    const loadWorld = async () => {
      try {
        // Reset water engine for new world
        waterEngineRef.current.reset();

        // Get URL params to check for world selection
        const params = new URLSearchParams(window.location.search);
        const worldName = params.get('world') || currentWorld;

        // Use the world generator for random or specific worlds
        const data = await getWorld(worldName);

        setCurrentWorld(worldName);
        const parsedMap = parseMap(data);
        setMap(parsedMap);
        setBiomeTiles(data.biomeTiles || {});
        setPlayerState({
          position: { x: data.position.x, y: data.position.y },
          facing: INITIAL_DIRECTION,
          momentum: { dx: 0, dy: 0 },
          inventory: {
            open: false,
            content: [],
            selectedType: null,
            selectedHotbarIndex: null,
            hotbar: [null, null, null, null, null]  // 5 hotbar slots
          },
          targetDistance: MAX_TARGET_DISTANCE,
          selected: { x: 0, y: 0 },
          breakTimer: null,
          isMoving: false
        });
      } catch (error) {
        console.error('Failed to load world:', error);
      }
    };

    loadWorld();
  }, []); // Only run on mount

  // Start water spreading simulation - set up once on mount
  useEffect(() => {
    waterSpreadIntervalRef.current = setInterval(() => {
      if (mapRef.current) {
        const tileUpdates = waterEngineRef.current.spreadWater(
          mapRef.current.tiles,
          mapRef.current.size.x,
          mapRef.current.size.y
        );

        if (Object.keys(tileUpdates).length > 0) {
          // Update mapRef immediately
          const newTiles = { ...mapRef.current.tiles };
          for (const key in tileUpdates) {
            newTiles[key] = tileUpdates[key];
          }
          mapRef.current = {
            ...mapRef.current,
            tiles: newTiles
          };

          // Let React batch the update naturally - removed flushSync for better performance
          setMap(prevMap => {
            const newTiles = { ...prevMap.tiles };
            for (const key in tileUpdates) {
              newTiles[key] = tileUpdates[key];
            }
            return {
              ...prevMap,
              tiles: newTiles
            };
          });
        }
      }
    }, WATER_SPREADING_INTERVAL);

    // Cleanup: Clear interval only on unmount
    return () => {
      if (waterSpreadIntervalRef.current) {
        clearInterval(waterSpreadIntervalRef.current);
        waterSpreadIntervalRef.current = null;
      }
    };
  }, []); // Empty deps - set up once on mount, never recreate

  const handleNewRandomWorld = () => {
    waterEngineRef.current.reset();
    if (waterSpreadIntervalRef.current) {
      clearInterval(waterSpreadIntervalRef.current);
      waterSpreadIntervalRef.current = null;
    }
    setMap(null);
    setDroppedItems([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waterSpreadIntervalRef.current) {
        clearInterval(waterSpreadIntervalRef.current);
      }
      waterEngineRef.current.reset();
    };
  }, []);

  const handlePlayerUpdate = (updates) => {
    setPlayerState((prev) => {
      const newState = { ...prev, ...updates };

      if (newState.inventory) {
        // Auto-deselect item if its count reaches 0
        if (newState.inventory.selectedType) {
          const selectedCount = newState.inventory.content.filter(
            item => item === newState.inventory.selectedType
          ).length;

          if (selectedCount === 0) {
            newState.inventory = {
              ...newState.inventory,
              selectedType: null
            };
          }
        }

        // Clear hotbar slots for items that have 0 count
        const clearedHotbar = newState.inventory.hotbar.map(slotItem => {
          if (slotItem === null) return null;
          const itemCount = newState.inventory.content.filter(item => item === slotItem).length;
          return itemCount === 0 ? null : slotItem;
        });

        if (JSON.stringify(clearedHotbar) !== JSON.stringify(newState.inventory.hotbar)) {
          newState.inventory = {
            ...newState.inventory,
            hotbar: clearedHotbar
          };
        }
      }

      return newState;
    });
  };

  const handleSelectItem = (itemType, hotbarIndex = null) => {
    setPlayerState((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        selectedType: itemType,
        selectedHotbarIndex: hotbarIndex
      }
    }));
  };

  const handleInventoryClose = () => {
    setPlayerState((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        open: false
      }
    }));
  };

  const handleHotbarItemAdd = (slotIndex, itemType) => {
    setPlayerState((prev) => {
      const newHotbar = prev.inventory.hotbar.map((item, i) => {
        if (i === slotIndex) {
          return itemType; // Assign item to this slot
        } else if (item === itemType) {
          return null; // Remove item from other slots to prevent duplicates
        }
        return item;
      });
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          hotbar: newHotbar
        }
      };
    });
  };

  const handleTileUpdate = (tileUpdates) => {
    setMap(prev => {
      const newTiles = {};

      // Copy all existing tiles
      for (const key in prev.tiles) {
        newTiles[key] = prev.tiles[key];
      }

      // Apply updates and ensure water state is preserved in both Tile object and as a plain object reference
      for (const key in tileUpdates) {
        const updatedTile = tileUpdates[key];

        // Store water state on the Tile instance
        if (updatedTile.has_water) {
          updatedTile.water = true;
        }

        // Store water state on the Tile object as a plain property for persistence
        updatedTile._waterState = updatedTile.has_water ? true : false;

        newTiles[key] = updatedTile;
      }

      return {
        ...prev,
        tiles: newTiles
      };
    });

    // Trigger water check for newly created holes
    if (mapRef.current) {
      const updatedTiles = {
        ...mapRef.current.tiles,
        ...tileUpdates
      };

      for (const key in tileUpdates) {
        const [xStr, yStr] = key.split('_');
        const x = parseInt(xStr);
        const y = parseInt(yStr);
        if (tileUpdates[key].has_hole && !tileUpdates[key].has_water) {
          waterEngineRef.current.checkNewHole(x, y, updatedTiles);
        }
      }
    }
  };

  const handleItemDrop = (item) => {
    setDroppedItems(prev => [...prev, item]);
  };

  const handleItemPickup = (itemId) => {
    setDroppedItems(prev => prev.filter(item => item.id !== itemId));
  };

  if (!map || !playerState) return <div>Loading...</div>;

  const currentBiome = biomeTiles ? getBiomeAtPosition(playerState.position.x, playerState.position.y, biomeTiles) : 'Unknown';

  return (
    <>
      <DebugUI position={playerState.position} biome={currentBiome} />
      <MapWindow
        map={map}
        position={playerState.position}
        facing={playerState.facing}
        inventory={playerState.inventory}
        selected={playerState.selected}
        breakTimer={playerState.breakTimer}
        isMoving={playerState.isMoving}
        droppedItems={droppedItems}
        onSelectItem={handleSelectItem}
        onInventoryClose={handleInventoryClose}
        onHotbarItemAdd={handleHotbarItemAdd}
      />
      <Player
        onPlayerUpdate={handlePlayerUpdate}
        onTileUpdate={handleTileUpdate}
        onItemDrop={handleItemDrop}
        onItemPickup={handleItemPickup}
        onSelectItem={handleSelectItem}
        onInventoryClose={handleInventoryClose}
        onHotbarItemAdd={handleHotbarItemAdd}
        map={map}
        position={playerState.position}
        momentum={playerState.momentum}
        facing={playerState.facing}
        inventory={playerState.inventory}
        targetDistance={playerState.targetDistance}
        selected={playerState.selected}
        droppedItems={droppedItems}
        waterEngine={waterEngineRef.current}
      />
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        flexDirection: 'column'
      }}>
        <button onClick={handleNewRandomWorld} style={{
          padding: '10px 15px',
          backgroundColor: '#909090ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
          Regen Random
        </button>
        <select
          defaultValue={currentWorld}
          onChange={(e) => {
            setCurrentWorld(e.target.value);
            window.location.search = `?world=${e.target.value}`;
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#737373ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <option value="demo">Demo World</option>
          <option value="empty">Empty World</option>
          <option value="large">Large World</option>
          <option value="random">Random World</option>
          <option value="random-simple">Random Simple</option>
        </select>
      </div>
    </>
  );
};

export default Game;
