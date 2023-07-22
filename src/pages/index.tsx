import { useBlockNumber } from 'wagmi'

// Components
import { Container, Navbar, Form, InputGroup, Button } from 'react-bootstrap'
import { Footer } from './styles/global'
import styled from 'styled-components'
import { useMemo, useState } from 'react'

export default function Home() {
  const { data: block, isError, isLoading } = useBlockNumber({
    watch: true,
  })

  const [game, setGame] = useState('')

  const isValidAddress = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/g.test(game)
  }, [game])

  return (
    <Container>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#">🛠️ Disputify</Navbar.Brand>
          <span style={{ float: 'right' }}>
            {!isError && !isLoading ? (
              <a href="#">
                <span style={{ color: 'green' }}>⏺</span> Connected
                {' | '}
                Block: {block?.toString()}
              </a>
            ) : (
              <a href="#">
                <span style={{ color: 'red' }}>⏺</span> Disconnected
              </a>
            )}
          </span>
        </Container>
      </Navbar>

      <Content>
        <InputGroup>
          <Form.Control placeholder="0xbeefbabe" onKeyUp={(e) => setGame(e.currentTarget.value)} />
        </InputGroup>
        <br />
        <Button
          variant="secondary"
          size="lg"
          disabled={!isValidAddress}
          onClick={() => {
            window.location.href = `/game/${game}`
          }}
        >
          Search Game
        </Button>
      </Content>

      <Footer>
        Made with ❤️ by clabby.
      </Footer>
    </Container>
  )
}

const Content = styled.div`
  margin: 5em auto;
  width: 50%;
  text-align: center;
`
