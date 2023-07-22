import useDisputeGame from "@/hooks/useGameState";
import { Code } from "@/styles/global";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { Col, Container, Overlay, Row } from "react-bootstrap";
import { styled } from "styled-components";

const Game = () => {
  const router = useRouter()
  const { id: gameProxyAddr } = router.query
  const { isFetching, error, data } = useDisputeGame(gameProxyAddr)

  return (
    <Container>
      <h1>
        <CopyCode
          code={`${gameProxyAddr?.slice(0, 6)}..${gameProxyAddr?.slice(38, 42)}`}
          toCopy={gameProxyAddr as string}
        />
      </h1>
      <hr />
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
            <Box variant="text">
              <h3>Abs Prestate</h3>
              <br />
              <CopyCode
                code={`${data.absolutePrestate.slice(0, 10)}..${data.absolutePrestate.slice(58, 66)}`}
                toCopy={data.absolutePrestate}
              />
            </Box>
          </Col>
          <Col>
            <Box variant="text">
              <h3>Root Claim</h3>
              <br />
              <CopyCode
                code={`${data.rootClaim.slice(0, 10)}..${data.rootClaim.slice(58, 66)}`}
                toCopy={data.rootClaim}
              />
            </Box>
          </Col>
          <Col>
            <Box variant="text">
              <h3>Created</h3>
              <br />
              {new Date(Number(data.createdAt) * 1000).toLocaleString()}
            </Box>
          </Col>
          <Col>
            <Box variant="text">
              <h3>Claims</h3>
              <br />
              {data.claims.length}
            </Box>
          </Col>
        </Row>
      )}
    </Container>
  )
}

const CopyCode = ({
  code,
  toCopy
}: {
  code: string,
  toCopy: string
}) => {
  const [show, setShow] = useState(false);

  const showCopiedOverlay = () => {
    if (show) return
    setShow(true)
    setTimeout(() => {
      setShow(false)
    }, 3000)
  }

  return (
    <>
      <Code onClick={() => {
        navigator.clipboard.writeText(toCopy)
        showCopiedOverlay()
      }}>
        {code}
        {' '}
        <FontAwesomeIcon icon={show ? faCheck : faCopy} />
      </Code>
    </>
  )
}

const Box = styled.div<{ variant: string }>`
  width: 100%;
  text-align: center;
  border: 1px solid var(--${props => props.variant});
  border-radius: 8px;
  padding: 25px;

  h1 {
    font-weight: bold;
  }
`

const CenterBox = styled(Box)`
  width: 50%;
  margin: 10em auto;
  padding: 50px;
`

export default Game;
