let test = require('tap').test;
let aStar = require('../a-star');
let aStarBi = require('../a-star/bidirectional');
let fromDot = require('ngraph.fromdot');
let asciiUtils = require('./graphFromAscii');

test('it can find paths', (t) => {
  let graph = fromDot(`digraph G {
    a -> b
    b -> c
    b -> d
    c -> d
  }`);
  
  graph.getNode('a').data = { x: 0, y: 0 };
  graph.getNode('b').data = { x: 2, y: 0 };  graph.getNode('c').data = { x: 1, y: 1 }
  graph.getNode('d').data = { x: 2, y: 2 }

  let pathFind = aStar(graph, {
    heuristic(from, to) {
      let fromPos = from.data;
      let toPos = to.data;

      return aStar.l2(fromPos, toPos);
    },
    distance(from, to) {
      let fromPos = from.data;
      let toPos = to.data;

      return aStar.l2(fromPos, toPos);
    }
  });

  let path = pathFind.find('a', 'd')
  t.equals(path.length, 3, 'Three nodes in path')
  t.equals(path[0].id, 'd', 'd is here')
  t.equals(path[1].id, 'b', 'b is here')
  t.equals(path[2].id, 'a', 'a is here')

  t.end();
});

test('it finds path on simple graph', (t) => {
  let testCases = [{
    name: 'smallWorld',
    grid: [
      '......',
      '..@@..',
      '...@..',
      '......',
    ],
    queries: [{
      from: '1;1', to: '1;4',
      route: [
        '.####.',
        '.#@@#.',
        '...@..',
        '......',
      ]
    }, {
      from: '0;0', to: '1;4',
      route: [
        '#####.',
        '..@@#.',
        '...@..',
        '......',
      ]
    }, {
      from: '0;0', to: '3;1',
      route: [
        '##....',
        '.#@@..',
        '.#.@..',
        '.#....',
      ]
    }]
  }, {
    name: 'bidirectional checker',
    grid: [
      '......',
      '......',
      '..@@@.',
      '......',
      '......',
      '......',
      '......',
      '......',
      '......',
      '......',
      '......',
      '......',
      '......',
      '......',
    ], queries: [{
      from: '12;1', to: '1;4', 
      route: [
      '......',
      '.####.',
      '.#@@@.',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '.#....',
      '......',
      ]
    }]
  }]

  testCases.forEach(testCase => {
    let graph = asciiUtils.graphFromTextArray(testCase.grid);
    testCase.queries.forEach(query => {
      let expected = query.route.join('\n')
      let path = aStarBi(graph, manhattanFromData());
      let foundRoute = path.find(query.from, query.to).map(toPos);
      let grid = asciiUtils.graphToTextGrid(graph);
      grid.drawPath(foundRoute);

      t.equals(grid.toString(), expected, testCase.name + '. path found from ' + query.from + ' to ' + query.to);
    })
  })

  t.end();
})

function toPos(p) {
  return p.data;
}

function manhattanFromData() {
  return {
    heuristic: distance,
    distance: distance
  };

  function distance(from, to) {
    let fromPos = from.data;
    let toPos = to.data;

    return aStar.l1(fromPos, toPos);
  }
}