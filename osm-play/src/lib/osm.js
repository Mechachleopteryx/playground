import postData from './postData';

export function getAreasAround(lonLat, bounds) {
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast()
  return postData(
    `[timeout:10][out:json];
is_in(${lonLat.lat}, ${lonLat.lng})->.a;
way(pivot.a);
out tags bb;
out ids geom(${sw.lat},${sw.lng},${ne.lat},${ne.lng});
relation(pivot.a);
out tags bb;`
  );
}

export function getRelationBoundary(relId) {
  return postData(`[timeout:10][out:json];
rel(${relId});
(
  way(r);
  node(w);
);
out skel;`).then(response => {
  var nodes = new Map();
  var ways = [];
  response.elements.forEach(el => {
    if (el.type === 'node') {
      nodes.set(el.id, el);
    } else if (el.type === 'way') {
      ways.push(el);
    }
  });
  return {
    nodes, ways
  }
})
}

export function getRoadsInRelationship(relId) {
  return postData(
  `[timeout:10][out:json];
rel(${relId});
map_to_area->.a;
(
 way["highway"="road"](area.a);
 node(w);
);
out skel;`);
}