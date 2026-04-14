import styled from 'styled-components';

const DebugContainer = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  width: 150px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  line-height: 1.6;
`;

const DebugLine = styled.div`
  white-space: nowrap;
`;

const DebugUI = ({ position, biome }) => {
  return (
    <DebugContainer>
      <DebugLine>x: {position.x.toFixed(0)}</DebugLine>
      <DebugLine>y: {position.y.toFixed(0)}</DebugLine>
      <DebugLine>biome: {biome || 'unknown'}</DebugLine>
    </DebugContainer>
  );
};

export default DebugUI;
