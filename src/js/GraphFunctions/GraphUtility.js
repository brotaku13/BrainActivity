// generates a color scale to be used when scaling the colors of the nodes
const colorScale = chroma.scale(['purple', 'blue', 'cyan', 'green', 'yellow', 'red'])
    .mode('lch')
    .colors(100)
    .map(hex => {
        return chroma(hex).css();
    })

/**
 * Manual update of the Graph elements. Graph elements will not update unless this is called. 
 * nodeRelSize is used because it is a default scale factor for each node. 
 */
function updateGraph(graphs) {
    for (i = 0; i < graphs.length; i++) {
        graphs[i].graph.nodeRelSize(4);
    }
}

/**
 * Highlights all neighbors of the node. This is done by finding the neighborhood of
 * the selected node, and then fining the elements of the graph that are not in the neighborhood
 * and fading those elements out. 
 * @param {Graph node} node a node object from the Graph
 */
function highlightNeighbors(nodeID, graphs) {
    for (i = 0; i < graphs.length; i++) {
        let elems = graphs[i].cy.nodes(`#${nodeID}`);

        if (elems.length !== 0) {

            let neighbors = elems.closedNeighborhood()
            let notNeighbors = graphs[i].cy.elements().difference(neighbors);

            for (n = 0; n < notNeighbors.length; n++) {
                let elem = notNeighbors[n];
                if (elem.isNode()) {
                    elem.data().nodeLink.selected = false;
                } else {
                    elem.data().edgeLink.selected = false;
                }
            }
        } else {
            console.log('Could not find specified node');
        }
    }
}

/**
 * deselects all nodes by setting the selected property to true. Uses Promises which makes
 * this operation async and slightly more performant
 */
function deselectAll(graphs) {
    for (i = 0; i < graphs.length; i++) {
        let cyNodes = graphs[i].cy.nodes();
        let cyEdges = graphs[i].cy.edges();

        new Promise((resolve, reject) => {
            for (n = 0; n < cyNodes.length; n++) {
                cyNodes[n].data().nodeLink.selected = true;
            }
        })
        new Promise((resolve, reject) => {
            for (n = 0; n < cyEdges.length; n++) {
                cyEdges[n].data().edgeLink.selected = true;
            }
        })
    }
}

/**
 * Find the corresponding node in the graph and then focuses on that node. Positioning the camera
 * to focus on the node. 
 * @param {Number} nodeId ID for a node in the Graph
 */
function focusNode(nodeId, graph, cy) {
    let cyNodes = cy.nodes(`#${nodeId}`);
    let node = cyNodes[0].data().nodeLink;

    const distance = 100;
    const distRatio = 1 + distance / Math.hypot(node.fx, node.fy, node.fz);

    graph.cameraPosition({
            x: node.fx * distRatio,
            y: node.fy * distRatio,
            z: node.fz * distRatio
        }, //new position
        node,
        3000 // transition time
    );
}

/**
 * Links two cameras from two separate instances of 3d-force-graph so that moving the camera in one
 * moves the camera in the other. 
 * @param {3d-force-graph} conGraph 3d-force-graph object for the control brain
 * @param {3d-force-graph} ocdGraph 3d-force-graph object for the ocd brain
 */
function linkCameras(graphList) {
    let ocdGraph = graphList[0].graph;
    let conGraph = graphList[1].graph;

    //link con to ocd
    ocdGraph.camera().matrix = conGraph.camera().matrix;
    ocdGraph.camera().rotation = conGraph.camera().rotation;
    ocdGraph.camera().quaternions = conGraph.camera().quaternions;
    ocdGraph.camera().up = conGraph.camera().up;

    conGraph.controls().addEventListener('change', event => {
        moveCamera(event.target.object.position, ocdGraph, conGraph.cameraPosition().lookat);
    })

    ocdGraph.controls().addEventListener('change', event =>{
        moveCamera(event.target.object.position, conGraph, ocdGraph.cameraPosition().lookat);
    })

}

/**
 * 
 * @param {event} event a change event from movement of a camera within the graph
 * @param {3d-force-graph} graph 3d-force-graph object of which camera to move
 * @param {object} lookat an object containing the 
 */
function moveCamera(position, graph, lookat) {
    graph.cameraPosition({
        x: position.x,
        y: position.y,
        z: position.z
    }, lookat)
}

/**
 * 
 * @param {*} orbitId 
 * @param {*} graphList 
 * @param {*} maxValues 
 */
async function colorByOribtControl(orbitId, graphList, maxValues){
    console.log(orbitId);
    if(orbitId > 72 || orbitId < 0){
        alert('No data for those orbit counts');
    } else {
        //using orbit frequency coloring - set this for the node labels
        GRAPH_DATA.orbitColoring = orbitId;

        //color by orbit frequency
        colorByOrbit(orbitId, graphList, maxValues);
        generateScaleNumbers(maxValues.orbits[orbitId]);
        document.getElementById('scale-label').innerText = `Orbit: ${orbitId}`;

        showScale(); //showscale
        updateGraph(graphList);
    }
}

/**
 * Controller for the node coloring. Depending on which colorIndex this function receives, 
 * it will color the node by a different scale. Use this for everything but coloring by node orbit
 * frequency
 * @param {String} colorIndex The type of coloring to apply to the nodes
 */
function colorNodeBy(colorIndex, graphs, maxValues) {
    //show the scale if hidden
    showScale();
    switch (colorIndex) {
        case 'degree':
            colorByDegree(graphs, maxValues);
            generateScaleNumbers(maxValues.degree);
            document.getElementById('scale-label').innerText = `Degree`;
            break
        case 'strength':
            colorByStrength(graphs, maxValues);
            generateScaleNumbers(maxValues.strength);
            document.getElementById('scale-label').innerText = `Node Strength`;
            break;
        case 'degree_centrality':
            colorByDegreeCentrality(graphs, maxValues);
            generateScaleNumbers(maxValues.degreeCentrality);
            document.getElementById('scale-label').innerText = `Degree Centrality`;
            break;
        case 'betweenness_centrality':
            colorByBetweennessCentrality(graphs, maxValues);
            generateScaleNumbers(maxValues.betweennessCentrality);
            document.getElementById('scale-label').innerText = `Betweenness Centrality`;
            break;
        default:
            colorByBase(graphs);
            hideScale();
    }

    //update graphs colors
    updateGraph(graphs);

    //set this to null so we know that we are no longer coloring by orbit frequency, which
    // turns off the labels as well as disables arrow functionality
    GRAPH_DATA.orbitColoring = null;
}

/**
 * Colors the nodes based on their total degree. 
 */
function colorByDegree(graphs, maxValues) {
    if (!maxValues.degree) {
        let maxDegree = 0;
        //find max degree in both graphs while also setting the degree value in each node
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();

            for (n = 0; n < nodes.length; n++) {
                let degree = nodes[n].degree();
                nodes[n].data().nodeLink.degree = degree !== 0 ? degree : 1;

                //set maxDegee
                maxDegree = max(degree, maxDegree);
            }
        }
        //set maxDegee between the 2 graphs for use later
        maxValues.degree = maxDegree;

        //after found max, find and set the color from a linear color scale
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();
            for (n = 0; n < nodes.length; n++) {
                let degree = nodes[n].data().nodeLink.degree;
                let color = getColor(degree, maxValues.degree);
                nodes[n].data().nodeLink.scaledColor.degree = color;
            }
        }
    }
    for (i = 0; i < graphs.length; i++) {
        let nodes = graphs[i].cy.nodes();
        for (n = 0; n < nodes.length; n++) {
            let graphNode = nodes[n].data().nodeLink;
            graphNode.color = graphNode.scaledColor.degree
        }
    }
}

/**
 * color nodes by total strength. Strength is defined as the total sum of their adjacent 
 * edge weights. (Opsahl)
 */
function colorByStrength(graphs, maxValues) {
    if (!maxValues.strength) {
        let maxStrength = 0;
        //find max strength in both graphs while also setting the strength value in each node
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();

            for (n = 0; n < nodes.length; n++) {
                let adjacent = nodes[n].neighborhood();
                let strength = adjacent.reduce((acc, elem) => {
                    if (elem.isEdge()) {
                        return acc + elem.data().weight;
                    }
                    return acc;
                }, 0)

                nodes[n].data().nodeLink.strength = strength !== 0 ? strength : .01;
                maxStrength = max(strength, maxStrength)
            }
        }
        //set max Strength between the 2 graphs for use later
        maxValues.strength = maxStrength;

        //after found max, find and set the color from a linear color scale
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();
            for (n = 0; n < nodes.length; n++) {
                let strength = nodes[n].data().nodeLink.strength;
                let color = getColor(strength, maxValues.strength);
                nodes[n].data().nodeLink.scaledColor.strength = color;
            }
        }
    }
    for (i = 0; i < graphs.length; i++) {
        let nodes = graphs[i].cy.nodes();
        for (n = 0; n < nodes.length; n++) {
            let graphNode = nodes[n].data().nodeLink;
            graphNode.color = graphNode.scaledColor.strength
        }
    }
}

/**
 * Color node based on weighted degree centrality. 
 */
function colorByDegreeCentrality(graphs, maxValues) {
    if (!maxValues.degreeCentrality) {
        let maxDegreeCentrality = 0;

        let centralityConfig = {
            root: undefined,
            weight: edge => {
                return edge.data().weight;
            }
        }
        //find max degree centrality in both graphs while also setting the degree centrality value in each node
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();

            for (n = 0; n < nodes.length; n++) {
                let root = nodes[n];
                centralityConfig.root = root;
                let degreeCen = graphs[i].cy.$().degreeCentrality(centralityConfig).degree;

                nodes[n].data().nodeLink.degreeCentrality = degreeCen;

                maxDegreeCentrality = max(maxDegreeCentrality, degreeCen);
            }
        }
        //set max Strength between the 2 graphs for use later
        maxValues.degreeCentrality = maxDegreeCentrality;

        //after found max, find and set the color from a linear color scale
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();
            for (n = 0; n < nodes.length; n++) {
                let degreeCentrality = nodes[n].data().nodeLink.degreeCentrality;
                let color = getColor(degreeCentrality, maxValues.degreeCentrality);
                nodes[n].data().nodeLink.scaledColor.degreeCentrality = color;
            }
        }
    }

    for (i = 0; i < graphs.length; i++) {
        let nodes = graphs[i].cy.nodes();
        for (n = 0; n < nodes.length; n++) {
            let graphNode = nodes[n].data().nodeLink;
            graphNode.color = graphNode.scaledColor.degreeCentrality
        }
    }
}

/**
 * color node based on betweenness centrality
 */
function colorByBetweennessCentrality(graphs, maxValues) {
    if (!maxValues.betweennessCentrality) {

        let maxBetweennessCentrality = 0;

        //find max betweenness centrality in both graphs while also setting the betweenness centrality value in each node
        for (i = 0; i < graphs.length; i++) {

            let bc = graphs[i].cy.$().betweennessCentrality();
            let nodes = graphs[i].cy.nodes();

            for (n = 0; n < nodes.length; n++) {
                let root = nodes[n];
                let betweennessCen = bc.betweenness(root);

                nodes[n].data().nodeLink.betweennessCentrality = betweennessCen;

                maxBetweennessCentrality = max(betweennessCen, maxBetweennessCentrality);
            }
        }
        //set max Strength between the 2 graphs for use later
        maxValues.betweennessCentrality = maxBetweennessCentrality;

        //after found max, find and set the color from a linear color scale
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();
            for (n = 0; n < nodes.length; n++) {
                let betweennessCentrality = nodes[n].data().nodeLink.betweennessCentrality;
                let color = getColor(betweennessCentrality, maxValues.betweennessCentrality);
                nodes[n].data().nodeLink.scaledColor.betweennessCentrality = color;
            }
        }
    }

    for (i = 0; i < graphs.length; i++) {
        let nodes = graphs[i].cy.nodes();
        for (n = 0; n < nodes.length; n++) {
            let graphNode = nodes[n].data().nodeLink;
            graphNode.color = graphNode.scaledColor.betweennessCentrality
        }
    }
}

function colorByOrbit(orbitId, graphs, maxValues){
    if(!maxValues.orbits[orbitId]){
        let maxFrequency = 0;

        for(i = 0; i < graphs.length; i++){
            let nodes = graphs[i].cy.nodes();

            for(n = 0; n < nodes.length; n++){
                let frequency = nodes[n].data().orbits[orbitId];
                maxFrequency = max(frequency, maxFrequency);
            }
        }

        maxValues.orbits[orbitId] = maxFrequency;
        for (i = 0; i < graphs.length; i++) {
            let nodes = graphs[i].cy.nodes();
            for (n = 0; n < nodes.length; n++) {
                let frequency = nodes[n].data().nodeLink.orbits[orbitId];
                let color = getColor(frequency, maxValues.orbits[orbitId]);
                nodes[n].data().nodeLink.scaledColor.orbits[orbitId] = color;
            }
        }
    }

    for (i = 0; i < graphs.length; i++) {
        let nodes = graphs[i].cy.nodes();
        for (n = 0; n < nodes.length; n++) {
            let graphNode = nodes[n].data().nodeLink;
            graphNode.color = graphNode.scaledColor.orbits[orbitId];
        }
    }
}

/**
 * Color all nodes the base color, removing all scaling. 
 */
function colorByBase(graphs) {
    for (i = 0; i < graphs.length; i++) {
        let cyNodes = graphs[i].cy.nodes();
        let cyEdges = graphs[i].cy.edges();
        new Promise((resolve, reject) => {
            for (n = 0; n < cyNodes.length; n++) {
                cyNodes[n].data().nodeLink.color = BASE_NODE_COLOR;
            }
        })
        new Promise((resolve, reject) => {
            for (n = 0; n < cyEdges.length; n++) {
                cyEdges[n].data().edgeLink.color = BASE_EDGE_COLOR;
            }
        })
    }
}

//Gets the color from te generated color array. 
function getColor(current, max) {
    let percent = Math.round((current / max) * 100)
    percent = percent !== 0 ? percent : 1;
    return colorScale[percent - 1];
}

function max(a, b) {
    return a > b ? a : b;
}