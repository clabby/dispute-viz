import { useCallback, useEffect, useState } from "react"
import { Address, Hash } from "viem"
import FaultGameABI from '../../public/faultdisputegame.json'
import { usePublicClient } from "wagmi"

const useDisputeGame = (address: string | null, upTo: number | undefined): { isFetching: boolean, error?: string, data?: GameData } => {
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
        client.readContract({ ...contract, functionName: 'l2BlockNumber', args: [] }),
        client.readContract({ ...contract, functionName: 'status', args: [] })
      ])

      const numClaims = Number(res[3])

      const req = []
      for (let i = 0; i < (upTo || numClaims); i++) {
        req.push(client.readContract({ ...contract, functionName: 'claimData', args: [i] }))
      }
      let claims: ClaimData[] = (await Promise.all(req)).map((res: any) => {
        return {
          parentIndex: res[0] as number,
          countered: res[1] as boolean,
          claim: res[2] as Hash,
          position: res[3] as BigInt,
          clock: res[4] as BigInt
        }
      })

      // Clear out any existing errors.
      setError(undefined)
      // Set the data.
      setData({
        claims,
        numClaims,
        createdAt: res[0] as number,
        rootClaim: res[1] as Hash,
        absolutePrestate: res[2] as Hash,
        l2BlockNumber: res[4] as number,
        status: res[5] as number,
        winner: findWinner(claims)
      })
    } catch (e) {
      setError('Failed to fetch setup data. Is this a valid game address?')
    }
  }, [address, upTo])

  useEffect(() => {
    fetch()
  }, [address, upTo])

  return {
    isFetching: !data && !error,
    error,
    data
  }
}

// ----
// Types
export interface GameData {
  claims: ClaimData[]
  numClaims: number
  createdAt: number
  rootClaim: Hash
  absolutePrestate: Hash
  l2BlockNumber: number
  status: number
  winner: Winner
}

export interface ClaimData {
  parentIndex: number
  countered: boolean
  claim: Hash
  position: BigInt
  clock: BigInt
}

export interface Winner {
  index: number
  traceIndex: number
  opposesRoot: boolean
}

// ----
// Resolution

const findWinner = (claims: ClaimData[], upTo?: number): Winner => {
  if (!upTo) {
    upTo = claims.length
  }
  let leftMostIndex = upTo - 1
  let leftMostTraceIndex = Number.MAX_SAFE_INTEGER
  for (let i = leftMostIndex; i > 0;) {
    const claim = claims[i--]

    if (claim.countered) {
      continue
    }

    const trIdx = traceIndex(Number(claim.position), 64)
    if (trIdx < leftMostTraceIndex) {
      leftMostIndex = i + 1
      leftMostTraceIndex = trIdx
    }
  }

  return {
    index: leftMostIndex,
    traceIndex: leftMostTraceIndex,
    opposesRoot: depth(Number(claims[leftMostIndex].position)) % 2 !== 0
  }
}

// ----
// Positions

type Position = number

export const depth = (position: Position): number => {
  return 31 - Math.clz32(position)
}

const indexAtDepth = (position: Position): number => {
  return position - (1 << depth(position))
}

const left = (position: Position): Position => {
  return position << 1
}

const right = (position: Position): Position => {
  return left(position) | 1
}

const parent = (position: Position): Position => {
  return position >> 1
}

const rightIndex = (position: Position, maxDepth: number): number => {
  let remaining = maxDepth - depth(position);
  return (position << remaining) | ((1 << remaining) - 1)
}

export const traceIndex = (position: Position, maxDepth: number): number => {
  return indexAtDepth(rightIndex(position, maxDepth))
}

const move = (position: Position, isAttack: boolean): Position => {
  return (Number(!isAttack) | position) << 1
}

export default useDisputeGame
