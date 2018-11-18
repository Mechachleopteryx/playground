import createPanZoom from 'panzoom';
import {MAX_DEPTH} from './buildGraph';
import createTextMeasure from './measureText';
import createAggregateLayout from './aggregateLayout';
import bus from '../bus';

let svg = require('simplesvg');

export default function createRenderer(progress) {
  const scene = document.querySelector('#scene');
  const nodeContainer = scene.querySelector('#nodes');
  const edgeContainer = scene.querySelector('#edges');
  const hideTooltipArgs = {isVisible: false};

  const panzoom = createPanZoom(scene);
  const defaultRectangle = {left: -500, right: 500, top: -500, bottom: 500}
  panzoom.showRectangle(defaultRectangle);

  // maps node id to node ui
  let nodes = new Map();

  // maps link id to link ui
  let links = new Map();

  let layout, graph, currentLayoutFrame = 0;
  let textMeasure = createTextMeasure(scene);
  bus.on('graph-ready', onGraphReady);

  return {
    render,
    dispose
  }

  function dispose() {
    clearLastScene();
    bus.off('graph-ready', onGraphReady);
  }

  function onMouseMove(e) {

    const id = e.target && e.target.id;
    const link = links.get(id);
    if (link) {
      showTooltip(link, e.clientX, e.clientY);
    } else {
      hideTooltip();
    }
  }

  function showTooltip(minLink, clientX, clientY) {
    const {fromId, toId} = minLink.link;
    bus.fire('show-tooltip', {
      isVisible: true,
      from: fromId, 
      to: toId, 
      x: clientX,
      y: clientY
    });

    removeHighlight();

    nodes.get(fromId).classList.add('hovered');
    nodes.get(toId).classList.add('hovered');
    minLink.ui.classList.add('hovered');
  }

  function hideTooltip() {
    bus.fire('show-tooltip', hideTooltipArgs);
    removeHighlight();
  }

  function removeHighlight() {
    scene.querySelectorAll('.hovered').forEach(removeHoverClass);
  }

  function removeHoverClass(el) {
    el.classList.remove('hovered');
  }

  function render(newGraph) {
    clearLastScene();
    graph = newGraph;

    layout = createAggregateLayout(graph, progress);
    
    layout.on('ready', drawLinks);

    nodes = new Map();
    links = new Map();

    graph.forEachNode(addNode);
    graph.on('changed', onGraphStructureChanged);

    cancelAnimationFrame(currentLayoutFrame);
    currentLayoutFrame = requestAnimationFrame(frame)
  }

  function onGraphReady(readyGraph) {
    if (readyGraph === graph) {
      layout.setGraphReady();
      progress.startLayout();
    }
  }

  function frame() {
    if (layout.step()) {
      currentLayoutFrame = requestAnimationFrame(frame)
    }
    updatePositions();
  }

  function onGraphStructureChanged(changes) {
    changes.forEach(change => {
      if (change.changeType === 'add' && change.node) {
        addNode(change.node);
      }
    })
  }

  function drawLinks() {
    progress.done();
    graph.forEachLink(drawLink);
    document.addEventListener('mousemove', onMouseMove);
  }

  function drawLink(link) {
    let from = layout.getNodePosition(link.fromId);
    let to = layout.getNodePosition(link.toId);

    let fromNode = graph.getNode(link.fromId).data;
    let toNode = graph.getNode(link.toId).data;
    const depth = (fromNode.depth + toNode.depth)/2;
    const dRatio = (MAX_DEPTH - depth)/MAX_DEPTH;
    const strokeWidth = 8 * dRatio + 2;
    const color = Math.round((200 - 75) * (1 - dRatio) + 75);
    var ui = svg('path', {
      id: link.id,
      'stroke-width': strokeWidth,
      fill: 'black',
      stroke: `rgb(${color}, ${color}, ${color})`,
      d: `M${from.x},${from.y} L${to.x},${to.y}`
    });
    edgeContainer.appendChild(ui);

    links.set(link.id, {ui, link});
  }

  function clearLastScene() {
    clear(nodeContainer);
    clear(edgeContainer);

    document.removeEventListener('mousemove', onMouseMove);
    if (layout) layout.off('ready', drawLinks);
    if (graph) graph.off('changed', onGraphStructureChanged);
  }

  function clear(el) {
    while (el.lastChild) {
        el.removeChild(el.lastChild);
    }
  }

  function addNode(node) {
    const dRatio = (MAX_DEPTH - node.data.depth)/MAX_DEPTH;
    let pos = getNodePosition(node.id);
    if (node.data.depth === 0) {
      layout.pinNode(node);
    }

    const uiAttributes = getNodeUIAttributes(node.id, dRatio);
    layout.addNode(node.id, uiAttributes);

    const rectAttributes = {
      x: uiAttributes.x,
      y: uiAttributes.y,
      width: uiAttributes.width,
      height: uiAttributes.height,
      rx: uiAttributes.rx,
      ry: uiAttributes.ry,
      fill: 'white',
      'stroke-width': uiAttributes.strokeWidth, 
      stroke: '#58585A'
    }
    const textAttributes = {
      'font-size': uiAttributes.fontSize,
      x: uiAttributes.px,
      y: uiAttributes.py
    }
    
    const rect = svg('rect', rectAttributes);
    const text = svg('text', textAttributes)
    text.text(node.id);

    const ui = svg('g', {
      transform: `translate(${pos.x}, ${pos.y})`
    });
    ui.appendChild(rect);
    ui.appendChild(text);

    nodeContainer.appendChild(ui);
    nodes.set(node.id, ui);
  }


  function getNodeUIAttributes(nodeId, dRatio) {
    const fontSize = 24 * dRatio + 12;
    const size = textMeasure(nodeId, fontSize);
    const width = size.totalWidth + size.spaceWidth * 6;
    const height = fontSize * 1.6;

    return {
      fontSize,
      width,
      height,
      x: -width/2,
      y: -height/2,
      rx: 15 * dRatio + 2,
      ry: 15 * dRatio + 2,
      px: -width/2 + size.spaceWidth*3,
      py: -height/2 + fontSize * 1.1,
      strokeWidth: 4 * dRatio + 1
    };
  }

  function updatePositions() {
    nodes.forEach((ui, nodeId) => {
      let pos = getNodePosition(nodeId)
      ui.attr('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }

  function getNodePosition(nodeId) {
    return layout.getNodePosition(nodeId);
  }
}