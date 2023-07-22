import useDisputeGame from "@/hooks/useGameState";
import { Code } from "@/styles/global";
import { useRouter } from "next/router";
import { Col, Container, Row } from "react-bootstrap";
import { styled } from "styled-components";

const Game = () => {
  const router = useRouter()
  const { id: gameProxyAddr } = router.query
  const { isFetching, error, data } = useDisputeGame(gameProxyAddr)

  return (
    <Container>
      {isFetching && <CenterBox variant="warning">Loading...</CenterBox>}
      {error && (
        <CenterBox variant="error">
          <h1>Error</h1>
          {error}
          <br />
          <Code>{gameProxyAddr}</Code>
        </CenterBox>
      )}
      {data && (
        <Row>
          <Col>
            <Box variant="text"></Box>
          </Col>

          <Col>
            <Box variant="text"></Box>
          </Col>

          <Col>
            <Box variant="text"></Box>
          </Col>
        </Row>
      )}
    </Container>
  )
}

const Box = styled.div<{ variant: string }>`
  width: 100%;
  text-align: center;
  border: 1px solid var(--${props => props.variant});
  border-radius: 8px;
  padding: 50px;
`

const CenterBox = styled(Box)`
  width: 50%;
  margin: 10em auto;
`

export default Game;
