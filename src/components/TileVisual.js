import styled from "styled-components"
import { link, TILE_SIZE, TileName } from "./util"
import React, { useEffect, useState } from "react"

// Seeded pseudo-random function based on coordinates
const getOffsetY = (x, y) => {
  const seed = (x * 73856093 ^ y * 19349663) >>> 0;
  return ((seed % 40) - 20); // Range: -20 to +19 pixels
}

// Tile types that should receive vertical offset variation
const OFFSET_TILE_TYPES = [
  TileName.GRASS_PLANT,
  TileName.BUSH,
  TileName.DEAD_BUSH,
  TileName.DAISY,
  TileName.SUNFLOWER,
  TileName.DAFFODIL
]

const isOffsetTile = (tileName) => OFFSET_TILE_TYPES.includes(tileName)

const StyledTile = styled.div.attrs(({ $x, $y }) => ({
  style: {
    left: `${$x * TILE_SIZE}px`,
    top: `${$y * TILE_SIZE}px`,
  },
}))`
  position: absolute;
  width: ${TILE_SIZE}px;
  height: ${TILE_SIZE}px;
  border: none;
  background-image: ${({ $background }) => $background};
  background-size: cover;
`

const WaterOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: ${({ $waterBg2 }) => $waterBg2};
  background-size: cover;
  background-position: 0 0;
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  animation: waterFlicker 5s ease-in-out infinite;
  
  @keyframes waterFlicker {
    0%, 100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }
`

const GrassPlantOverlay = styled.div`
  position: absolute;
  top: ${({ $offsetY }) => $offsetY}px;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: ${({ $grassPlantBg }) => $grassPlantBg};
  background-size: cover;
  background-position: 0 0;
  z-index: 2;
  pointer-events: none;
`

const SelectedIndicator = styled.div`
  height: 95%;
  width: 95%;
  background-color: rgba(255,255,255, 0.1);
  border: 0.1rem solid rgba(0,0,0, 0.5);
`

const BreakBar = styled.div`
  height: ${({ $breakTimer }) => $breakTimer ? 100 : 0}%;
  width: 100%;
  transition: ${({ $breakTimer }) => $breakTimer ? $breakTimer / 1000 : 0}s linear;
  background-color: rgba(0,0,0, 0.4);
  position: absolute;
  bottom: 0;
`

const buildClasses = (tileObj) => {
  return ["tile", tileObj.ground?.name, tileObj.object?.name].join(' ')
}

const buildBackground = (tileObj, adjacentTiles) => {
  return tileObj.textures(adjacentTiles).map(t => link(t)).join(', ')
}

// const TileVisual = ({
const TileVisual = ({
  tileObj,
  selected,
  breakTimer,
  adjacentTiles
}) => {
  const [timer, setTimer] = useState(null);
  const [background, setBackground] = useState(() => buildBackground(tileObj, adjacentTiles));
  const [isWater, setIsWater] = useState(false);
  const [waterBg1, setWaterBg1] = useState(null);
  const [waterBg2, setWaterBg2] = useState(null);
  const [offsetBg, setOffsetBg] = useState(null);
  const prevTexturesRef = React.useRef(null);

  useEffect(() => {
    const textures = tileObj.textures(adjacentTiles);
    
    // Check if this is a water tile
    const hasWater = textures.some(t => t.startsWith('water/'));
    const hasOffsetObject = isOffsetTile(tileObj.object?.name);
    
    // Only update vars if textures actually changed
    const textureString = textures.join('|');
    if (textureString !== prevTexturesRef.current) {
      prevTexturesRef.current = textureString;
      
      setIsWater(hasWater);
      
      // Handle offset-enabled objects (grass plant, bushes, flowers, etc) - it's the first texture
      if (hasOffsetObject && textures.length > 0) {
        setOffsetBg(link(textures[0]));
      } else {
        setOffsetBg(null);
      }
      
      if (hasWater && textures.length >= 2) {
        setWaterBg1(link(textures[0]));
        setWaterBg2(link(textures[1]));
      } else {
        setWaterBg1(null);
        setWaterBg2(null);
      }
      
      // Preload images and build background
      // If there's an offset object, exclude it from the background since we render it separately in the overlay
      const texturesToRender = hasOffsetObject ? textures.slice(1) : textures;
      const newBackground = texturesToRender.map(t => link(t)).join(', ');
      const imagePromises = textures.map(texture => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = `textures/${texture}`;
        });
      });
      
      
      Promise.all(imagePromises).then(() => {
        setBackground(newBackground);
      });
    }
  }, [tileObj, adjacentTiles]);

  useEffect(() => {
    if (selected.x === tileObj.x && selected.y === tileObj.y && breakTimer) {
      requestAnimationFrame(() => {
        setTimer(breakTimer);
      });
    } else {
      setTimer(null);
    }
  }, [breakTimer, selected.x, selected.y, tileObj.x, tileObj.y]);

  return <StyledTile
    className={buildClasses(tileObj)}
    $background={background}
    $x={tileObj.x}
    $y={tileObj.y}
  >
    {offsetBg && <GrassPlantOverlay $grassPlantBg={offsetBg} $offsetY={getOffsetY(tileObj.x, tileObj.y)} />}
    {isWater && waterBg2 && <WaterOverlay $waterBg2={waterBg2} />}
    {(selected.x === tileObj.x && selected.y === tileObj.y) &&
      <SelectedIndicator>
        <BreakBar
          $breakTimer={timer}
        />
      </SelectedIndicator>
    }
  </StyledTile>
// }
};

export default TileVisual