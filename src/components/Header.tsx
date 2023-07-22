import { Container, Navbar } from "react-bootstrap"
import { useBlockNumber } from "wagmi"

const Header = () => {
  const { data: block, isError, isLoading } = useBlockNumber({
    watch: true,
  })

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="/">🍊 Disputify</Navbar.Brand>
        <span style={{ float: 'right' }}>
          {!isError && !isLoading ? (
            <a href="#">
              <span style={{ color: 'var(--success)' }}>⏺</span> Connected
              {' | '}
              Block: {block?.toString()}
            </a>
          ) : (
            <a href="#">
              <span style={{ color: 'var(--error)' }}>⏺</span> Disconnected
            </a>
          )}
        </span>
      </Container>
    </Navbar>
  )
}

export default Header
