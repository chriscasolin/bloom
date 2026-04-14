import styled from "styled-components";
import { link, TILE_SIZE, getItemTexture } from "./util";
import React from "react";

const ItemContainer = styled.div.attrs(({ $x, $y }) => ({
  style: {
    left: `${$x}px`,
    top: `${$y}px`
  },
}))`
  position: absolute;
  width: ${TILE_SIZE * 0.4}px;
  height: ${TILE_SIZE * 0.4}px;
  background-image: ${({ $background }) => $background};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
  animation: float 2s ease-in-out infinite;
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-5px);
    }
  }
`;

const StackCount = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 3px;
  min-width: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const DroppedItem = ({ item }) => {
  return (
    <ItemContainer
      $x={item.x}
      $y={item.y}
      $background={link(getItemTexture(item.type))}
    >
      {item.count > 1 && <StackCount>{item.count}</StackCount>}
    </ItemContainer>
  );
};

export default DroppedItem;
