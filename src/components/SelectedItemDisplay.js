import styled from "styled-components";
import { link, getItemTexture } from "./util";

const DisplayContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  background-image: ${link('menu/quick_select.png')};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
`;

const SlotContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 60px;
  height: 60px;
  aspect-ratio: 1;
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

const ItemCount = styled.div`
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

const SelectedItemDisplay = ({ selectedType, inventoryContent }) => {
  // Count how many of this item type we have (if selected)
  const count = selectedType && inventoryContent ? inventoryContent.filter(item => item === selectedType).length : 0;

  return (
    <DisplayContainer>
      <SlotContainer $selected={!!selectedType}>
        {selectedType && (
          <>
            <ItemImage $background={link(getItemTexture(selectedType))} />
            <ItemCount>×{count}</ItemCount>
          </>
        )}
      </SlotContainer>
    </DisplayContainer>
  );
};

export default SelectedItemDisplay;
