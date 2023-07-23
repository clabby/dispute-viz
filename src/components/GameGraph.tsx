import GraphViz from 'graphviz-react'
import { GameData, depth, traceIndex } from '@/hooks/useGameState'
import { useMemo, useState } from 'react'

type GameGraphProps = {
  data?: GameData
  upTo?: number
}

const baseNodeData = [
  { position: 1, traceIndex: 15, attack: 2, },
  { position: 2, traceIndex: 7, attack: 4, defend: 6, },
  { position: 3, },
  { position: 4, traceIndex: 3, attack: 8, defend: 10, },
  { position: 5 },
  { position: 6, traceIndex: 11, attack: 12, defend: 14, },
  { position: 7 },
  { position: 8, traceIndex: 1, attack: 16, defend: 18, },
  { position: 9 },
  { position: 10, traceIndex: 5, attack: 20, defend: 22, },
  { position: 11 },
  { position: 12, traceIndex: 9, attack: 24, defend: 26, },
  { position: 13 },
  { position: 14, traceIndex: 13, attack: 28, defend: 30, },
  { position: 15, },
  { position: 16, leaf: true, traceIndex: 0 },
  { position: 17, leaf: true, },
  { position: 18, leaf: true, traceIndex: 2 },
  { position: 19, leaf: true, },
  { position: 20, leaf: true, traceIndex: 4 },
  { position: 21, leaf: true, },
  { position: 22, leaf: true, traceIndex: 6 },
  { position: 23, leaf: true, },
  { position: 24, leaf: true, traceIndex: 8 },
  { position: 25, leaf: true, },
  { position: 26, leaf: true, traceIndex: 10 },
  { position: 27, leaf: true, },
  { position: 28, leaf: true, traceIndex: 12 },
  { position: 29, leaf: true, },
  { position: 30, leaf: true, traceIndex: 14 },
  { position: 31, leaf: true, },
]

const UNUSED_CONNECTIONS = `
8 -> 17[color="#667174"]
4 -> 9[color="#667174"]
9 -> 18[color="#667174"]
9 -> 19[color="#667174"]
2 -> 5[color="#667174"]
5 -> 10[color="#667174"]
10 -> 21[color="#667174"]
5 -> 11[color="#667174"]
11 -> 22[color="#667174"]
11 -> 23[color="#667174"]
1 -> 3[color="#667174"]
3 -> 6[color="#667174"]
12 -> 25[color="#667174"]
6 -> 13[color="#667174"]
13 -> 26[color="#667174"]
13 -> 27[color="#667174"]
3 -> 7[color="#667174"]
7 -> 14[color="#667174"]
14 -> 29[color="#667174"]
7 -> 15[color="#667174"]
15 -> 30[color="#667174"]
15 -> 31[color="#667174"]
`

const MAX_GAME_DEPTH = 4
const FIRST_LEAF_NODE = Math.pow(2, MAX_GAME_DEPTH)

const GameGraph = ({ data, upTo }: GameGraphProps) => {
  const claims: any = useMemo(() => {
    if (data && upTo) {
      return data.claims.length === 1 ? data.claims : data.claims.slice(0, upTo + 1)
    }
  }, [data, upTo])

  const renderClaim = (claim: any): string => {
    var value = claim.value
    if (value.startsWith('0x')) {
      value = value.substring('0x'.length)
    }
    if (value.length > 4) {
      value = value.substring(0, 2) + '…' + value.substring(value.length - 2)
    }
    if (Number(claim.position) === 1) {
      value = '🏁 ' + value
    } else if (claim.countered) {
      value = '⚔️ ' + value
    } else {
      value = '👑 ' + value
    }
    return value
  }

  const color = (n: any) => {
    if (n.active) {
      return n.accessType === 'Attack' ? '#EA6962' : '#A9B665'
    } else {
      return n.accessType === 'Attack' ? '#EA696222' : '#A9B66522'
    }
  }

  const levelColor = (n: any) => {
    if (depth(n.position) % 2 === 0) {
      return '#89B4FA'
    } else {
      return '#D8A657'
    }
  }

  const [steps, setSteps] = useState<number[]>([])

  const textNodes = useMemo(() => {
    return baseNodeData
      .filter(data => data.leaf)
      .map((data: any) => `${data.position}->t${data.position - FIRST_LEAF_NODE}[style=dotted][color=darkgoldenrod1][arrowhead=none]` +
        `t${Number(data.position) - FIRST_LEAF_NODE}[shape=square]` +
        `${steps.includes(traceIndex(data.position, MAX_GAME_DEPTH))
          ? `[fillcolor=darkgoldenrod1][style=filled][fontcolor=black]`
          : `[fontcolor=darkgoldenrod1]`
        }[color=darkgoldenrod1][label="${data.position - FIRST_LEAF_NODE}"]`)
      .join('\n')
  }, [steps])

  const nodeData = useMemo(() => {
    if (claims) {
      // Create copy of base node data and pre-populate all nodes
      const nodes: any[] = baseNodeData.map(data => Object.assign({}, data, {
        idx: data.position - 1,
        label: data.position,
        unused: data.traceIndex === undefined,
      }))
      nodes.forEach((node: any) => {
        node.claims = []
        if (node.attack !== undefined) {
          nodes[node.attack - 1].accessedFrom = node.position
          nodes[node.attack - 1].accessType = 'Attack'
        }
        if (node.defend !== undefined) {
          nodes[node.defend - 1].accessedFrom = node.position
          nodes[node.defend - 1].accessType = 'Defend'
        }
      })
      let steps: number[] = []
      claims.forEach((claim: any, i: number) => {
        const node = nodes[Number(claim.position) - 1]
        node.active = true
        node.countered = claim.countered
        node.claims.push({ value: claim.claim, countered: claim.countered, position: claim.position })

        if (claim.countered && depth(Number(claim.position)) === MAX_GAME_DEPTH) {
          steps.push(traceIndex(Number(claim.position), MAX_GAME_DEPTH))
        }
      })
      setSteps(steps)
      return nodes
    }
  }, [data, claims])

  const nodes = useMemo(() => {
    if (nodeData) {
      return nodeData.map(data => {
        var label = data.label
        if (data.active) {
          label += '\n' + data.claims.map(renderClaim).join('\n')
        }
        var node = `${data.position}[label="${label}"]`
        if (data.unused) {
          node += '[color="#667174"][fontcolor="#667174"]'
        } else if (data.active) {
          node += `[color="${levelColor(data)}"][fontcolor="${color(data)}"]`
        } else {
          node += '[color="#D4BE98"][fontcolor="#D4BE98"]'
        }
        return node
      }).join('\n')
    }
  }, [nodeData])

  const connections = useMemo(() => {
    if (nodeData) {
      return nodeData.map(data => {
        if (data.accessedFrom !== undefined) {
          const isAttack = data.accessType === 'Attack'
          const c = color(data)
          return `${data.accessedFrom}->${data.position}` +
            `[constraint=${isAttack}]` +
            `[color="${c}"][fontcolor="${c}"]` +
            `[label=${data.active ? data.accessType : '""'}]`
        } else {
          return ""
        }
      }).join('\n')
    }
  }, [nodeData])

  const g = useMemo(() => {
    if (textNodes && nodes && connections) {
      const a = `
        digraph {
          // nodes
          ${nodes}

          // unusedConnections
          ${UNUSED_CONNECTIONS}

          // connections
          ${connections}

          // textNodes
          ${textNodes}
        }
      `
      return a
    }
  }, [textNodes, nodes, connections])

  return g && <GraphViz dot={g} options={{ width: '100%', height: '100%' }} />
}

export default GameGraph
