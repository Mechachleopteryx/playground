var FibonacciHeap = require('@tyriar/fibonacci-heap');

module.exports = shortestPaths

function shortestPaths (graph, getEdgeLength) {
  // maps from node id to shortest path algorithm state.
  let searchStateMemory = new Map()

  let length = getEdgeLength || euclidLength

  return findShortestPaths

  function findShortestPaths(src, dst) {
    if (src === dst) return

    let minPath = findPath(src, dst)
    let p = minPath
    let points = []
    while (p) {
      points.unshift(graph.getNode(p.value).data)
      // let from = p
      p = p.prevPath
      // let to = p
      // rememberEdge(from, to);
    }

    return points
  }

  function findPath (from, to) {
    let searchState = searchStateMemory.get(from)
    if (!searchState) {
      let heap = new FibonacciHeap()
      // TODO: Is there a way to get fibonacci node without extra map?
      let nodeIdToHeapNode = new Map()

      graph.forEachNode(n => {
        let distance = n.id === from ? 0 : Number.POSITIVE_INFINITY
        let node = heap.insert(distance, n.id)
        node.prevPath = undefined

        nodeIdToHeapNode.set(n.id, node)
      })

      searchState = {
        nodeIdToHeapNode: nodeIdToHeapNode,
        heap: heap
      }

      searchStateMemory.set(from, searchState)
    }

    let nodeIdToHeapNode = searchState.nodeIdToHeapNode
    let heap = searchState.heap
    let lastResult = nodeIdToHeapNode.get(to)

    if (lastResult && lastResult.prevPath) return lastResult

    while (heap.size() > 0) {
      let minNode = heap.extractMinimum()

      visitNode(minNode)

      if (minNode.value === to) {
        return lastResult
      }
    }

    function visitNode (node) {
      let nodeId = node.value; // node.id
      let srcInfo = nodeIdToHeapNode.get(nodeId)

      graph.forEachLinkedNode(nodeId, otherNode => {
        let distance = srcInfo.key + length(graph.getNode(nodeId), otherNode)
        let otherInfo = nodeIdToHeapNode.get(otherNode.id)
        if (distance < otherInfo.key) {
          otherInfo.prevPath = srcInfo
          heap.decreaseKey(otherInfo, distance);
        }
      })
    }
  }
}

function euclidLength (a, b) {
  let aPos = a.data
  let bPos = b.data
  let dx = aPos.x - bPos.x
  let dy = aPos.y - bPos.y

  // return dx * dx + dy * dy
  return Math.sqrt(dx * dx + dy * dy)
}
