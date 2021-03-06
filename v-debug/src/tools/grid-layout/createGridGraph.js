import createGraph from 'ngraph.graph';
import cellKey from './cellKey';

export default function createGridGraph(bbox, cellSize) {
  let {width, height} = bbox;
  let cols = Math.ceil(width/cellSize);
  let rows = Math.ceil(height/cellSize);

  let grid = createGraph(); 
  let x0 = bbox.minX;
  let y0 = bbox.minY;

  for (let i = 0; i <= cols; i ++) {
    for (let j = 0; j <= rows; j ++) {
      let x = x0 + i * cellSize;
      let y = y0 + j * cellSize;
      let thisKey = cellKey(x, y);
      grid.addNode(thisKey, { y, x })
      if (i > 0) {
        let otherKey = cellKey(x - cellSize, y);
        grid.addLink(thisKey, otherKey);
      }
      if (j > 0) {
        grid.addLink(thisKey, cellKey(x, y - cellSize));
      }
    }
  }

  return grid;
}