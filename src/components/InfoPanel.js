import styled from 'styled-components';
import { useEffect, useRef } from 'react';

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

  p {
    margin: 0 0 16px 0;
    line-height: 1.6;
    font-size: 14px;
    color: #d0d0d0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  h3 {
    margin: 20px 0 10px 0;
    color: #63a3d7;
    font-weight: 600;
    font-size: 16px;

    &:first-child {
      margin-top: 0;
    }
  }
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #4a4a4a;
  text-align: center;
  font-size: 12px;
  color: #888888;

  p {
    margin: 0;
  }
`;

const InfoPanel = ({ isOpen, onClose }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleArrowScroll = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (contentRef.current) {
          const scrollAmount = 50;
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

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>About</h2>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        <Content ref={contentRef}>
          <h3>Welcome to Bloom</h3>
          <p>
            Bloom is a peaceful exploration and building game where you can gather resources, 
            craft items, and shape your own world. Take your time and enjoy the journey.
          </p>

          <h3>Getting Started</h3>
          <p>
            Move around using the arrow keys and interact with the world around you. 
            Break tiles to collect resources, and use those resources to place new tiles 
            and create structures.
          </p>

          <h3>Resources & Crafting</h3>
          <p>
            Different tiles yield different resources when broken. Collect these materials 
            to expand what you can build. Your inventory can hold multiple items, and you 
            can organize them in your hotbar for quick access.
          </p>

          <h3>Water & Nature</h3>
          <p>
            Water flows naturally through the world. You can interact with water, create 
            channels, and use it as part of your designs.
          </p>

          <h3>Exploration</h3>
          <p>
            Each world is procedurally generated with diverse biomes and landscapes. 
            Explore to find different resources and discover the beauty of each region.
          </p>

          <h3>A Note on Browsers</h3>
          <p>
            If you experience performance issues, try switching to a different browser. I'm working out some problems with Chrome. Safari works well for me.
          </p>
        </Content>
      </Panel>
    </Overlay>
  );
};

export default InfoPanel;
