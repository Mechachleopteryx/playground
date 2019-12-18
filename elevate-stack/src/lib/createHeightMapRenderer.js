import { getRegion, lat2tile, long2tile, tile2long } from '../elevation';
import {MAPBOX_TOKEN} from '../config';

export default function createHeightMapRenderer(appState, map, canvas) {
  return {
    render
  }

  function render() {
    // this is a mess, made on purpose - I'm just experimenting.
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast()
    const zoom = Math.floor(map.getZoom(zoom));
    const startTileLat = lat2tile(ne.lat, zoom);
    const startTileLng = long2tile(sw.lng, zoom);
    const endTileLng = long2tile(ne.lng, zoom);
    const endTileLat = lat2tile(sw.lat, zoom);

    const oceanLevel = Number.parseFloat(appState.oceanLevel);
    let startXOffset = Math.round((startTileLng - Math.floor(startTileLng)) * 256);
    let startYOffset = Math.round((startTileLat - Math.floor(startTileLat)) * 256);
    let endXOffset = Math.round((Math.ceil(endTileLng) - endTileLng) * 256);
    let endYOffset = Math.round((Math.ceil(endTileLat) - endTileLat) * 256);

    getRegion(
      startTileLat, startTileLng,
      endTileLat, endTileLng,
      zoom,
      `https://api.mapbox.com/v4/mapbox.terrain-rgb/zoom/tLong/tLat.pngraw?access_token=${MAPBOX_TOKEN}`
    ).then(region => {
    let now = performance.now();
    let resHeight = canvas.height;
    let resWidth = canvas.width;
    let smoothSteps = parseFloat(appState.smoothSteps);

    canvas.style.opacity = appState.mapOpacity/100;

    let ctx = canvas.getContext('2d');
    let lineStroke = getColor(appState.lineColor);
    let lineFill = getColor(appState.lineBackground);

    let rowCount = Math.round(resHeight * appState.lineDensity/100);
    let scale = appState.heightScale;
    const regionIterator = createRegionIterator(region, 
      startXOffset, startYOffset,
      region.width - endXOffset, region.height - endYOffset
    );
    let {minH, maxH, maxRow} = regionIterator.getMinMaxHeight();

    let dh = maxH - minH;

    ctx.beginPath();
    ctx.fillStyle = getColor(appState.backgroundColor);
    ctx.fillRect(0, 0, resWidth, resHeight);
    let lastLine = [];
    let iteratorSettings = regionIterator.getIteratorSettings(rowCount, resHeight, maxRow);
    for (let row = iteratorSettings.start; row < iteratorSettings.stop; row += iteratorSettings.step) {
      drawPolyLine(lastLine);
      lastLine = [];

      for (let x = 0; x < resWidth; ++x) {
        let height = regionIterator.getHeight(row/resHeight, x/resWidth);

        let heightRatio = (height - minH)/dh;
        let fY = row - Math.floor(scale * heightRatio);

        if (height <= oceanLevel) {
          drawPolyLine(lastLine);
          lastLine = [];
        } else {
          lastLine.push(x, fY);
        }
      }
    }

    drawPolyLine(lastLine);

    let elapsed = performance.now() - now;
    console.log('Elapsed: ', elapsed/1000);

    function drawPolyLine(points) {
      if (points.length < 3) return;

      let smoothResult = smooth(points, smoothSteps);
      points = smoothResult.points;

      if (smoothResult.max - smoothResult.min > 2) {
        ctx.beginPath();
        ctx.fillStyle = lineFill;
        ctx.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
          ctx.lineTo(points[i], points[i + 1]);
        }
        ctx.lineTo(points[points.length - 2], smoothResult.max);
        ctx.lineTo(points[0], smoothResult.max);
        ctx.closePath();
        ctx.fill();
      }

      ctx.beginPath();
      ctx.strokeStyle = lineStroke;
      ctx.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1]);
      }
      ctx.stroke();
    }
  });
}

function smooth(points, windowSize) {
  let result = [];
  let max = Number.NEGATIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  let length = points.length / 2;
  for (let i = 0; i < length; i += 1) {
    const leftOffset = i - windowSize;
    const from = leftOffset >= 0 ? leftOffset : 0
    const to = i + windowSize + 1;

    let count = 0
    let sum = 0
    for (let j = from; j < to && j < length; j += 1) {
      sum += points[2 * j + 1]
      count += 1
    }

    let smoothHeight = sum / count;
    result[2 * i] = points[2 * i];
    result[2 * i + 1] = smoothHeight;

    if (max < smoothHeight) max = smoothHeight;
    if (min > smoothHeight) min = smoothHeight;
  }
  // let runningSum = 0;
  // neighborsCount = Math.min(points.length / 2, neighborsCount);
  // for (let j = 0; j < neighborsCount; j++) {
  //   runningSum += points[j * 2 + 1];
  // }

  // for (let j = 0; j < neighborsCount; j++) {
  //   let smoothHeight = runningSum / neighborsCount;
  //   result[j * 2] = points[j * 2];
  //   result[j * 2 + 1] = smoothHeight;

  //   if (max < smoothHeight) max = smoothHeight;
  //   if (min > smoothHeight) min = smoothHeight;
  // }
  // let neighborsStep = neighborsCount * 2;
  // let dt = Math.floor(neighborsCount / 2);

  // for (let i = neighborsStep; i < points.length; i += 2) {
  //   runningSum -= points[i - neighborsStep + 1];
  //   runningSum += points[i + 1];

  //   let smoothHeight = runningSum / neighborsCount;
  //   result[i] = points[i]; 
  //   if (i < points.length - dt * 2){
  //     result[i + 1 - dt * 2] = smoothHeight;
  //   } else {
  //     result[i + 1] = smoothHeight;
  //   }
  //   if (max < smoothHeight) max = smoothHeight;
  //   if (min > smoothHeight) min = smoothHeight;
  // }
  return {
    points: result,
    min,
    max
  };
}

function createRegionIterator(region, left, top, right, bottom) {
  let data = region.getContext('2d').getImageData(0, 0, region.width, region.height).data;

  return {
    getMinMaxHeight,
    getIteratorSettings,
    getHeight
  }

  function getHeight(row, col) {
    let x = Math.round(left + col * (right - left));
    let y = Math.round(top + row * (bottom - top));

    let index = (y * region.width + x) * 4;
    let R = data[index + 0];
    let G = data[index + 1];
    let B = data[index + 2];
    return decodeHeight(R, G, B);
  }

  function decodeHeight(R, G, B) {
    let height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
    if (height < -100) {
      // Fiji islands data has huge caves, which pushes the entire thing up.
      // I'm reducing it.
      height = height / 5000;
    }
    return height;
  }

  function getMinMaxHeight() {
    let minH = Number.POSITIVE_INFINITY;
    let maxH = Number.NEGATIVE_INFINITY;
    let maxRow = -1;
    for (let x = left; x < right; ++x) {
      for (let y = top; y < bottom; ++y) {
        let index = (y * region.width + x) * 4;
        let R = data[index + 0];
        let G = data[index + 1];
        let B = data[index + 2];
        let height = decodeHeight(R, G, B)
        if (height < minH) minH = height;
        if (height > maxH) {
          maxH = height;
          maxRow = y;
        }
      }
    }

    return {minH, maxH, maxRow};
  }


  function getIteratorSettings(rowCount, resHeight, includeRowIndex) {
    let stepSize = Math.round(resHeight / rowCount);
    let pos = includeRowIndex - stepSize;
    while (pos - stepSize > 0) pos -= stepSize;

    return {
      start: pos,
      step: stepSize,
      stop: resHeight
    }
  }
}

function getColor(color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}
}