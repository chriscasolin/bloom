import styled from 'styled-components';
import { useEffect, useRef } from 'react';
import { KEY } from './util';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  border: 2px solid #4a4a4a;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  color: #e0e0e0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #4a4a4a;

  h2 {
    margin: 0;
    font-weight: 600;
    color: #ffffff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  color: #a0a0a0;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #ffffff;
  }
`;

const Content = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(64, 116, 159, 0.4);
    border-radius: 2px;

    &:hover {
      background: rgba(61, 113, 155, 0.6);
    }
  }
`;

const Category = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin: 0 0 12px 0;
    color: #63a3d7;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const ControlItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ControlItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Action = styled.span`
  font-size: 14px;
  color: #e0e0e0;
`;

const Key = styled.span`
  font-size: 13px;
  font-weight: 600;
  background: rgba(100, 181, 246, 0.2);
  padding: 4px 10px;
  border-radius: 4px;
  min-width: 60px;
  text-align: center;
  white-space: nowrap;
`;

const ControlsPanel = ({ isOpen, onClose }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleArrowScroll = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (contentRef.current) {
          const scrollAmount = 400;
          if (e.key === 'ArrowUp') {
            contentRef.current.scrollTop -= scrollAmount;
          } else {
            contentRef.current.scrollTop += scrollAmount;
          }
        }
      }
    };

    window.addEventListener('keydown', handleArrowScroll);
    return () => window.removeEventListener('keydown', handleArrowScroll);
  }, [isOpen]);

  if (!isOpen) return null;

  const controls = [
    {
      category: 'Movement',
      items: [
        { action: 'Move North', key: KEY.NORTH.toUpperCase() },
        { action: 'Move South', key: KEY.SOUTH.toUpperCase() },
        { action: 'Move East', key: KEY.EAST.toUpperCase() },
        { action: 'Move West', key: KEY.WEST.toUpperCase() },
        { action: 'Stand Still', key: KEY.STILL.toUpperCase() },
        { action: 'Strafe', key: KEY.STRAFE.toUpperCase() },
      ]
    },
    {
      category: 'Interaction',
      items: [
        { action: 'Use / Break', key: 'SPACE' },
        { action: 'Interact', key: KEY.INTERACT.toUpperCase() },
        { action: 'Open Inventory', key: KEY.INVENTORY.toUpperCase() },
        { action: 'Toggle Target Distance', key: KEY.TARGET_DISTANCE.toUpperCase() },
      ]
    },
    {
      category: 'Inventory',
      items: [
        { action: 'Navigate', key: '↑ ↓ ← →' },
        { action: 'Select Item', key: 'SPACE' },
        { action: 'Close Inventory', key: 'ESC' },
        { action: 'Select Slot', key: '1-5' },
      ]
    },
    {
      category: 'Control Menu',
      items: [
        { action: 'Open / Close', key: '?' },
      ]
    }
  ];

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>Controls</h2>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>
        
        <Content ref={contentRef}>
          {controls.map((section, idx) => (
            <Category key={idx}>
              <h3>{section.category}</h3>
              <ControlItems>
                {section.items.map((item, itemIdx) => (
                  <ControlItem key={itemIdx}>
                    <Action>{item.action}</Action>
                    <Key>{item.key}</Key>
                  </ControlItem>
                ))}
              </ControlItems>
            </Category>
          ))}
        </Content>
      </Panel>
    </Overlay>
  );
};

export default ControlsPanel;
