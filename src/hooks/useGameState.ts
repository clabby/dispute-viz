import { useCallback, useEffect, useState } from "react"
import { Address, Hash } from "viem"
import FaultGameABI from '../../public/faultdisputegame.json'
import { usePublicClient } from "wagmi"

interface GameData {
  claims: ClaimData[]
  createdAt: number
  rootClaim: Hash
  absolutePrestate: Hash
}

interface ClaimData {
  parentIndex: number
  countered: boolean
  claim: Hash
  position: BigInt
  clock: BigInt
}

const useDisputeGame = (address: string | string[] | undefined): { isFetching: boolean, error?: string, data?: GameData } => {
  const [data, setData] = useState<GameData | undefined>()
  const [error, setError] = useState<string | undefined>()
  const client = usePublicClient()

  const contract = {
    address: address as Address,
    abi: FaultGameABI
  } as const;

  const fetch = useCallback(async () => {
    try {
      let res = await Promise.all([
        client.readContract({ ...contract, functionName: 'createdAt', args: [] }),
        client.readContract({ ...contract, functionName: 'rootClaim', args: [] }),
        client.readContract({ ...contract, functionName: 'ABSOLUTE_PRESTATE', args: [] }),
        client.readContract({ ...contract, functionName: 'claimDataLen', args: [] }),
      ])

      const req = []
      for (let i = 0; i < (res[3] as number); i++) {
        req.push(client.readContract({ ...contract, functionName: 'claimData', args: [i] }))
      }
      let claims: ClaimData[] = await Promise.all(req) as ClaimData[]

      // Clear out any existing errors.
      setError(undefined)
      // Set the data.
      setData({
        claims,
        createdAt: res[0] as number,
        rootClaim: res[1] as Hash,
        absolutePrestate: res[2] as Hash,
      })
    } catch (e) {
      console.error(e)
      console.error(address)
      setError('Failed to fetch setup data. Is this a valid game address?')
    }
  }, [address])

  useEffect(() => {
    fetch()
  }, [address])

  // TODO(clabby): Error handling
  return {
    isFetching: !data && !error,
    error,
    data
  }
}

export default useDisputeGame
