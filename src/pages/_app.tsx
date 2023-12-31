import type { AppProps } from 'next/app'
import { createPublicClient, http } from 'viem'
import { WagmiConfig, createConfig } from 'wagmi'
import { localhost } from 'wagmi/chains'

// Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/global.css'

// Components
import Header from '@/components/Header'
import PageFooter from '@/components/Footer'

const config = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain: localhost,
    transport: http()
  }),
})

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <WagmiConfig config={config}>
      <Header />
      <Component {...pageProps} />
      <PageFooter />
    </WagmiConfig>
  )
}

export default App
