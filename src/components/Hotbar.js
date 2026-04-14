import styled from "styled-components";
import { link, getItemTexture, TILE_SIZE } from "./util";

const HotbarContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 15px;
  background-image: ${link('menu/hotbar.png')};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
`;

const HotbarSlot = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-image: ${({ $selected }) => 
    $selected ? link('menu/menu_slot_selected.png') : link('menu/menu_slot.png')};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const ItemImage = styled.div`
  width: 50%;
  aspect-ratio: 1;
  background-image: ${({ $background }) => $background};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const SlotNumber = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
`;

const ItemCount = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
`;

const Hotbar = ({ hotbar, inventoryContent, selectedType, selectedHotbarIndex, onItemAdded, onSelectItem }) => {
  const getItemCount = (itemType) => {
    if (!inventoryContent || !itemType) return 0;
    return inventoryContent.filter(item => item === itemType).length;
  };

  const handleSlotClick = (item, index) => {
    // If clicking an empty slot, deselect (select null)
    if (!item && onSelectItem) {
      onSelectItem(null, index);
    }
  };

  return (
    <HotbarContainer>
      {hotbar.map((item, index) => {
        // Slot is selected if:
        // 1. It has an item AND that item matches selectedType, OR
        // 2. The selectedHotbarIndex matches this slot's index
        const isSelected = (item && item === selectedType) || (index === selectedHotbarIndex);
        
        return (
          <HotbarSlot 
            key={index} 
            $selected={isSelected}
            onClick={() => handleSlotClick(item, index)}
          >
            {item && (
              <>
                <ItemImage $background={link(getItemTexture(item))} />
                <ItemCount>×{getItemCount(item)}</ItemCount>
              </>
            )}
            <SlotNumber>{index + 1}</SlotNumber>
          </HotbarSlot>
        );
      })}
    </HotbarContainer>
  );
};

export default Hotbar;
