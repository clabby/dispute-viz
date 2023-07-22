import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Container, Form, InputGroup, Button } from 'react-bootstrap'
import { Code } from '../styles/global'

export default function Home() {
  const [game, setGame] = useState('')

  const isValidAddress = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/g.test(game)
  }, [game])

  return (
    <Container>
      <Content>
        <h1 style={{ marginBottom: '0.5em', fontSize: '72px' }}>🔍</h1>
        <InputGroup>
          <Form.Control placeholder="0xbaDC0DE..." onKeyUp={(e) => setGame(e.currentTarget.value)} />
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
          {isValidAddress ? (
            'View Dispute'
          ) : (
            <>
              Enter
              {' '}
              <Code>FaultDisputeGame</Code>
              {' '}
              address
            </>
          )}
        </Button>
      </Content>
    </Container>
  )
}

const Content = styled.div`
  margin: 5em auto;
  width: 50%;
  text-align: center;
`
