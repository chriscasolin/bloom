import styled from "styled-components"
import { link } from "./util"

const Background = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: rgba(0, 0, 0, 0.6);
`

const Content = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-image: ${link('menu/menu.png')};
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  box-sizing: border-box;
`

const Dialogue = ({ children }) => {
  return (
    <Background>
      <Content>
        {children}
      </Content>
    </Background>
  )
}

export default Dialogue;