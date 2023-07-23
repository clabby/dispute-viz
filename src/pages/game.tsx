import useDisputeGame from "@/hooks/useGameState";
import { Code } from "@/styles/global";
import { faCopy, faCheck, faClock, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { styled } from "styled-components";
import GameGraph from "@/components/GameGraph";

const Game = () => {
  const [upTo, setUpTo] = useState(0)
  const [playing, setPlaying] = useState(false)

  const queryParameters = useSearchParams()
  const gameProxyAddr = queryParameters.get('addr')
  const { isFetching, error, data } = useDisputeGame(gameProxyAddr, upTo)

  useEffect(() => {
    if (data && upTo === 0)
      setUpTo(data?.numClaims)

    if (data && playing) {
      const interval = setInterval(() => {
        setUpTo(Number(upTo + 1) > Number(data.numClaims) ? 1 : upTo + 1)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [data, playing])

  const winner = useMemo(() => {
    return data && data.winner
  }, [data])

  const maxTimeRemaining = useMemo(() => {
    if (winner && data) {
      const _winner = data.claims[winner.index]
      const winnerClockDuration = BigInt(_winner.clock.toString()) >> BigInt(0x40)
      const winnerClockTimestamp = BigInt(_winner.clock.toString()) & BigInt("0xFFFFFFFFFFFFFFFF")
      const opponentClockDuration = _winner.parentIndex === 0xFFFFFFFF
        ? BigInt(0)
        : BigInt(data.claims[data.claims[winner.index].parentIndex].clock.toString()) >> BigInt(0x40)

      console.log(winnerClockDuration, winnerClockTimestamp, opponentClockDuration)
      return (7 * 24 * 60 * 60) - Number(opponentClockDuration + winnerClockDuration + (BigInt(Math.floor(Date.now() / 1000)) - winnerClockTimestamp))
    }
  }, [winner])

  function durationToString(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds - (days * 86400)) / 3600);
    const minutes = Math.floor((seconds - (days * 86400) - (hours * 3600)) / 60);
    const secs = seconds - (days * 86400) - (hours * 3600) - (minutes * 60);
    const timeString = days.toString().padStart(2, '0') + 'd ' +
      hours.toString().padStart(2, '0') + 'h ' +
      minutes.toString().padStart(2, '0') + 'm ' +
      secs.toFixed(0).padStart(2, '0') + 's';

    return timeString;
  }

  return (
    <Container>
      <h1>
        <CopyCode
          code={`${gameProxyAddr?.slice(0, 6)}..${gameProxyAddr?.slice(38, 42)}`}
          toCopy={gameProxyAddr as string}
        />

        {data && (
          <span style={{ fontSize: '60%', verticalAlign: 'text-bottom', float: 'right', marginTop: '1em' }}>
            <span style={{ color: `var(--${data.status === 0 ? 'warning' : data.status === 1 ? 'success' : 'error'})` }}>⏺</span>
            {' '}
            {data.status === 0 ? 'In Progress' : data.status === 1 ? 'Defender Wins' : 'Challenger Wins'}
            {maxTimeRemaining && (
              <>
                <span style={{ color: 'var(--text-dark)' }}> | </span>
                <OverlayTrigger
                  overlay={<Tooltip>Maximum remaining time until resolution is available:<br /><Code>{durationToString(maxTimeRemaining)}</Code></Tooltip>}
                  placement="bottom"
                >
                  <FontAwesomeIcon icon={faClock} />
                </OverlayTrigger>
                <span style={{ color: 'var(--text-dark)' }}> | </span>
                <a style={{ cursor: 'pointer' }} onClick={() => setPlaying(!playing)}>
                  <FontAwesomeIcon icon={playing ? faPause : faPlay} />
                </a>
              </>
            )}
          </span>
        )}
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
        <>
          <OverlayTrigger overlay={<Tooltip>Showing up to claim # {upTo}</Tooltip>} placement="bottom">
            <Form.Range
              value={upTo}
              onChange={(e) => {
                setUpTo(Number(e.currentTarget.value))
              }}
              min={1}
              max={data.numClaims}
              disabled={data.numClaims === 1}
            />
          </OverlayTrigger>
          <Row lg={3}>
            <Col>
              <Box variant="text">
                <h3>Absolute Prestate</h3>
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
                <h3># Claims</h3>
                <br />
                {data.claims.length}
              </Box>
            </Col>
            <Col>
              <Box variant="text">
                <h3>Current Winner</h3>
                <br />
                {winner && (
                  <>
                    <OverlayTrigger
                      overlay={<Tooltip>{winner.opposesRoot ? 'Attacker of Root Claim' : 'Defender of Root Claim'}</Tooltip>}
                      placement="top"
                    >
                      <span>{winner.opposesRoot ? '🔪' : '🛡️'}</span>
                    </OverlayTrigger>
                    {' '}
                    Claim # {winner.index + 1}
                    {' | '}
                    <CopyCode
                      code={`${data.claims[winner.index].claim.slice(0, 8)}..${data.claims[winner.index].claim.slice(58, 64)}`}
                      toCopy={data.claims[winner.index].claim}
                    />
                  </>
                )}
              </Box>
            </Col>
            <Col>
              <Box variant="text">
                <h3>Disputed L2 Block #</h3>
                <br />
                {data.l2BlockNumber.toString()}
              </Box>
            </Col>
            <GraphContainer>
              <GameGraph data={data} upTo={upTo} />
            </GraphContainer>
          </Row>
        </>
      )}
    </Container >
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
  margin: 10px 0;

  h1 {
    font - weight: bold;
  }
`

const CenterBox = styled(Box)`
  width: 50%;
  margin: 10em auto;
  padding: 50px;
`

const GraphContainer = styled.div`
  margin-top: 2em;
  width: 100%;
`

export default Game;
