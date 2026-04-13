'use strict';

const ELK = require('elkjs');

// ---------------------------------------------------------------------------
// computeLayout(config)
//
// Uses ELK.js to compute node positions for a set of workflow steps.
//
// @param {object} config
//   @param {Array}  config.steps     - [{ label: string, actor: string }]
//   @param {string} config.layout    - 'swimlane' | 'vertical'
//   @param {string} [config.direction] - 'RIGHT' | 'DOWN' (default: 'DOWN' for swimlane)
// @returns {Promise<object>} { nodes, edges, actors, graphWidth, graphHeight }
// ---------------------------------------------------------------------------
async function computeLayout(config) {
  const elk = new ELK();
  const steps = config.steps || [];
  const layout = config.layout || 'vertical';
  const direction = config.direction || (layout === 'swimlane' ? 'DOWN' : 'DOWN');

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 60;

  // Build ELK nodes
  const elkNodes = steps.map(function (step, i) {
    return {
      id: 'step-' + i,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      labels: [{ text: step.label }],
      _actor: step.actor,
      _index: i
    };
  });

  // Build ELK edges (sequential pairs)
  const elkEdges = [];
  for (var i = 0; i < steps.length - 1; i++) {
    elkEdges.push({
      id: 'edge-' + i,
      sources: ['step-' + i],
      targets: ['step-' + (i + 1)]
    });
  }

  // Build ELK graph
  var graph;

  if (layout === 'swimlane') {
    // Group nodes by actor into compound parent nodes
    var actorMap = {};
    var actorOrder = [];
    elkNodes.forEach(function (node) {
      var actor = node._actor || 'Unknown';
      if (!actorMap[actor]) {
        actorMap[actor] = [];
        actorOrder.push(actor);
      }
      actorMap[actor].push(node);
    });

    var children = actorOrder.map(function (actorName, idx) {
      return {
        id: 'lane-' + idx,
        labels: [{ text: actorName }],
        _actorName: actorName,
        layoutOptions: {
          'elk.direction': 'DOWN',
          'elk.padding': '[top=40,left=20,bottom=20,right=20]',
          'elk.spacing.nodeNode': '30'
        },
        children: actorMap[actorName].map(function (n) {
          return {
            id: n.id,
            width: n.width,
            height: n.height,
            labels: n.labels,
            _actor: n._actor,
            _index: n._index
          };
        })
      };
    });

    graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '40',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
        'elk.spacing.componentComponent': '60',
        'elk.padding': '[top=20,left=20,bottom=20,right=20]'
      },
      children: children,
      edges: elkEdges
    };
  } else {
    // Flat vertical layout
    graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '40',
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
        'elk.spacing.componentComponent': '60',
        'elk.padding': '[top=20,left=20,bottom=20,right=20]'
      },
      children: elkNodes.map(function (n) {
        return {
          id: n.id,
          width: n.width,
          height: n.height,
          labels: n.labels,
          _actor: n._actor,
          _index: n._index
        };
      }),
      edges: elkEdges
    };
  }

  // Run ELK layout
  var result = await elk.layout(graph);

  // Extract positioned nodes with absolute coordinates
  var nodes = [];
  var actors = [];

  if (layout === 'swimlane') {
    // Walk compound parents (lanes)
    (result.children || []).forEach(function (lane) {
      var laneX = lane.x || 0;
      var laneY = lane.y || 0;

      actors.push({
        name: lane._actorName || (lane.labels && lane.labels[0] ? lane.labels[0].text : 'Unknown'),
        x: laneX,
        y: laneY,
        width: lane.width || 0,
        height: lane.height || 0
      });

      (lane.children || []).forEach(function (child) {
        nodes.push({
          id: child.id,
          label: child.labels && child.labels[0] ? child.labels[0].text : '',
          actor: child._actor || '',
          x: laneX + (child.x || 0),
          y: laneY + (child.y || 0),
          width: child.width || NODE_WIDTH,
          height: child.height || NODE_HEIGHT,
          index: child._index != null ? child._index : nodes.length
        });
      });
    });
  } else {
    // Flat layout — nodes are direct children
    (result.children || []).forEach(function (child) {
      nodes.push({
        id: child.id,
        label: child.labels && child.labels[0] ? child.labels[0].text : '',
        actor: child._actor || '',
        x: child.x || 0,
        y: child.y || 0,
        width: child.width || NODE_WIDTH,
        height: child.height || NODE_HEIGHT,
        index: child._index != null ? child._index : nodes.length
      });
    });
  }

  // Sort nodes by original step index
  nodes.sort(function (a, b) { return a.index - b.index; });

  // Extract edges with sections (bend points)
  var edges = (result.edges || []).map(function (edge) {
    return {
      id: edge.id,
      sourceId: edge.sources ? edge.sources[0] : '',
      targetId: edge.targets ? edge.targets[0] : '',
      sections: edge.sections || []
    };
  });

  return {
    nodes: nodes,
    edges: edges,
    actors: actors,
    graphWidth: result.width || 0,
    graphHeight: result.height || 0
  };
}

// ---------------------------------------------------------------------------
// Self-test: run with `node lib/elk-layout.js`
// ---------------------------------------------------------------------------
if (require.main === module) {
  var path = require('path');
  var bundles = require(path.join(__dirname, '..', 'data', 'bundles.json'));
  var bundle = bundles.bundles[0];
  console.log('Testing with bundle: ' + bundle.title);
  console.log('Steps: ' + bundle.idealizedSteps.length + ', Layout: ' + bundle.layout);

  computeLayout({
    steps: bundle.idealizedSteps,
    layout: bundle.layout
  }).then(function (result) {
    console.log('\n--- Layout Result ---');
    console.log('Nodes: ' + result.nodes.length);
    console.log('Edges: ' + result.edges.length);
    console.log('Actors: ' + result.actors.length);
    console.log('Graph size: ' + result.graphWidth + 'x' + result.graphHeight);
    console.log('\nNodes:');
    result.nodes.forEach(function (n) {
      console.log('  [' + n.index + '] ' + n.id + ' @ (' + n.x + ', ' + n.y + ') - ' + n.actor + ': ' + n.label);
    });
    console.log('\nActors:');
    result.actors.forEach(function (a) {
      console.log('  ' + a.name + ' @ (' + a.x + ', ' + a.y + ') ' + a.width + 'x' + a.height);
    });
    console.log(JSON.stringify(result, null, 2));
  }).catch(function (err) {
    console.error('ERROR:', err);
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  computeLayout
};
