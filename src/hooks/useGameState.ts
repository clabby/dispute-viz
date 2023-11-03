import { useCallback, useEffect, useState } from "react"
import { Address, Hash } from "viem"
import FaultGameABI from '@/../public/faultdisputegame.json'
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
        winner: resolveGame(claims, 4),
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
  opposesRoot: boolean
}

// ----
// Resolution

const resolveGame = (claims: ClaimData[], maxDepth: number, upTo?: number): Winner => {
  if (!upTo) {
    upTo = claims.length
  }

  // iterate claims in reverse order
  // mark their parents as disputed (reuse the countered bit for this purpose)
  // ... unless the current claim is disputed
  let subgames: ClaimData[] = claims.map((c) => {
    let disputed = false;
    if (depth(Number(c.position)) == maxDepth) {
      disputed = c.countered;
    }
    return {
      parentIndex: c.parentIndex,
      countered: disputed,
      claim: c.claim,
      position: c.position,
      clock: c.clock,
    }
  })
  for (let i = upTo-1; i >=0; i--) {
    const subgame = subgames[i]
    const parentSubgame = subgames[subgame.parentIndex]
    if (!subgame.countered && parentSubgame !== undefined) {
      parentSubgame.countered = true
    }
  }
  return {
    index: upTo-1,
    opposesRoot: subgames[0].countered,
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
