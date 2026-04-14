import Dialogue from "./Dialogue"
import styled from "styled-components"
import { link, getItemTexture, InventoryKeybinds } from "./util"
import { useEffect, useState, useRef } from "react"

const InventoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 80px;
  min-height: 0;
  flex: 1;
  box-sizing: border-box;
  overflow: auto;
`

const EmptyToolRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  padding-bottom: 15px;
`

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  padding: 0;
`

const InventorySlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 10px;
  background-image: ${({ $selected, $focused }) => {
    if ($selected) {
      return link('menu/menu_slot_selected.png');
    } else if ($focused) {
      return link('menu/menu_slot_selected.png');
    } else {
      return link('menu/menu_slot.png');
    }
  }};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
  transition: all 0.1s;
  position: relative;
  // filter: ${({ $focused }) => $focused ? 'brightness(1.2)' : 'brightness(1)'};
`

const ItemImage = styled.div`
  width: 60%;
  aspect-ratio: 1;
  background-image: ${({ $background }) => $background};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`

const ItemCount = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-weight: bold;
  font-size: 12px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 3px;
`

const ItemName = styled.div`
  position: absolute;
  bottom: -22px;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.6);
  text-transform: capitalize;
  white-space: nowrap;
  font-weight: bold;
`

const Inventory = ({ content, selectedType, onSelectItem, onClose, hotbar, onHotbarItemAdd }) => {
  const itemCounts = content.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  let items = Object.keys(itemCounts);
  
  // Move selected item to the start of the list
  if (selectedType && items.includes(selectedType)) {
    items = [selectedType, ...items.filter(item => item !== selectedType)];
  }
  
  // Create display items: __empty__ row + actual items
  const displayItems = ['__empty__', ...items];
  
  // Focus index 0 = empty, so we want to start at index 1 (first real item) if items exist
  const initialFocusIndex = items.length > 0 ? 1 : 0;
  const [focusedIndex, setFocusedIndex] = useState(initialFocusIndex);
  const containerRef = useRef(null);

  // Handle keyboard navigation with capture phase to intercept before other handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!displayItems.length) return;
      
      const currentFocused = displayItems[focusedIndex];
      const key = e.key.toLowerCase();
      const shiftKey = e.shiftKey;
      let handled = false;
      
      if (key === InventoryKeybinds.navigateUp) {
        e.preventDefault();
        if (focusedIndex === 0) {
          // Already at empty row, stay there
          handled = true;
        } else if (focusedIndex <= 5) {
          // In first row of items, move to empty
          setFocusedIndex(0);
          handled = true;
        } else {
          // Move up one row (5 items per row)
          setFocusedIndex(prev => Math.max(1, prev - 5));
          handled = true;
        }
      } else if (key === InventoryKeybinds.navigateDown) {
        e.preventDefault();
        if (focusedIndex === 0) {
          // From empty, go to first item
          setFocusedIndex(1);
          handled = true;
        } else if (shiftKey) {
          // Shift+Down: move 5 rows down
          setFocusedIndex(prev => Math.min(displayItems.length - 1, prev + 25));
          handled = true;
        } else {
          // Move down one row (5 items per row)
          setFocusedIndex(prev => Math.min(displayItems.length - 1, prev + 5));
          handled = true;
        }
      } else if (key === InventoryKeybinds.navigateLeft) {
        e.preventDefault();
        if (focusedIndex === 0) {
          // Empty row, stay at 0
          handled = true;
        } else if (shiftKey) {
          // Shift+Left: move to start of current row
          setFocusedIndex(prev => {
            const rowStart = 1 + Math.floor((prev - 1) / 5) * 5;
            return rowStart;
          });
          handled = true;
        } else {
          // Move left one item
          if (focusedIndex > 1) {
            setFocusedIndex(prev => prev - 1);
          }
          handled = true;
        }
      } else if (key === InventoryKeybinds.navigateRight) {
        e.preventDefault();
        if (focusedIndex === 0) {
          // Empty row, stay at 0
          handled = true;
        } else if (shiftKey) {
          // Shift+Right: move to end of current row
          setFocusedIndex(prev => {
            const rowStart = 1 + Math.floor((prev - 1) / 5) * 5;
            const rowEnd = Math.min(displayItems.length - 1, rowStart + 4);
            return rowEnd;
          });
          handled = true;
        } else {
          // Move right one item, but not past end
          if (focusedIndex < displayItems.length - 1) {
            setFocusedIndex(prev => prev + 1);
          }
          handled = true;
        }
      } else if (key === InventoryKeybinds.select) {
        e.preventDefault();
        e.stopPropagation();
        // Select the item and close inventory
        // Convert __empty__ to null when selecting
        const itemToSelect = currentFocused === '__empty__' ? null : currentFocused;
        onSelectItem(itemToSelect);
        if (onClose) {
          onClose();
        }
        handled = true;
      } else if (key === InventoryKeybinds.deselectCurrent) {
        e.preventDefault();
        e.stopPropagation();
        // Deselect current item and close inventory
        if (selectedType) {
          onSelectItem(selectedType);
        }
        if (onClose) {
          onClose();
        }
        handled = true;
      } else if (key >= '1' && key <= '5') {
        // Number keys 1-5 to add currently focused item to hotbar
        e.preventDefault();
        e.stopPropagation();
        const hotbarSlot = parseInt(key) - 1;
        if (onHotbarItemAdd) {
          // Convert __empty__ to null for hotbar
          const itemToAdd = currentFocused === '__empty__' ? null : currentFocused;
          onHotbarItemAdd(hotbarSlot, itemToAdd);
        }
        handled = true;
      }
      
      if (handled) {
        e.stopPropagation();
      }
    };

    // Use capture phase to intercept events before other listeners
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [focusedIndex, displayItems, selectedType, onSelectItem, onClose, onHotbarItemAdd]);

  return (
    <Dialogue>
      <InventoryContainer ref={containerRef}>
        <EmptyToolRow>
          <InventorySlot 
            $selected={'__empty__' === selectedType}
            $focused={0 === focusedIndex}
            onClick={() => {
              onSelectItem(null);
              if (onClose) {
                onClose();
              }
            }}
          >
            <ItemImage $background={link(getItemTexture('__empty__'))} />
            <ItemName>empty</ItemName>
          </InventorySlot>
        </EmptyToolRow>
        <InventoryGrid>
          {displayItems.slice(1).map((item, index) => (
            <InventorySlot 
              key={item}
              $selected={item === selectedType}
              $focused={index + 1 === focusedIndex}
              onClick={() => {
                onSelectItem(item);
                if (onClose) {
                  onClose();
                }
              }}
            >
              <ItemImage $background={link(getItemTexture(item))} />
              <ItemCount>x{itemCounts[item]}</ItemCount>
              <ItemName>{item}</ItemName>
            </InventorySlot>
          ))}
        </InventoryGrid>
      </InventoryContainer>
    </Dialogue>
  )
}

export default Inventory