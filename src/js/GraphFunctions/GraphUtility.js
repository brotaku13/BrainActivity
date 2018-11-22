
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
    for(i = 0; i < graphs.length; i++){
        graphs[i].graph.nodeRelSize(4);
    }
}

/**
 * Highlights all neighbors of the node. This is done by finding the neighborhood of
 * the selected node, and then fining the elements of the graph that are not in the neighborhood
 * and fading those elements out. 
 * @param {Graph node} node a node object from the Graph
 */
function highlightNeighbors(node) {
    let elems = cy.nodes(`#${node.id}`);
    if (elems.length !== 0) {

        let neighbors = elems.closedNeighborhood()
        let notNeighbors = cy.elements().difference(neighbors);
        for (i = 0; i < notNeighbors.length; i++) {
            let elem = notNeighbors[i];
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

/**
 * deselects all nodes by setting the selected property to true. Uses Promises which makes
 * this operation async and slightly more performant
 */
function deselectAll() {
    let cyNodes = cy.nodes();
    let cyEdges = cy.edges();

    new Promise((resolve, reject) => {
        for (i = 0; i < cyNodes.length; i++) {
            cyNodes[i].data().nodeLink.selected = true;
        }
    })
    new Promise((resolve, reject) => {
        for (i = 0; i < cyEdges.length; i++) {
            cyEdges[i].data().edgeLink.selected = true;
        }
    })
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

    graph.cameraPosition(
        { x: node.fx * distRatio, y: node.fy * distRatio, z: node.fz * distRatio }, //new position
        node,
        3000 // transition time
    );
}

function linkCameras(conGraph, ocdGraph){
    //link con to ocd
    ocdGraph.camera().matrix = conGraph.camera().matrix;
    ocdGraph.camera().rotation = conGraph.camera().rotation;
    ocdGraph.camera().quaternions = conGraph.camera().quaternions;
    ocdGraph.camera().up = conGraph.camera().up;

    conGraph.controls().addEventListener('change', event =>{
        moveCamera(event.target.object, ocdGraph, conGraph.cameraPosition().lookat);
    })

}

function moveCamera(event, graph, lookat){
    graph.cameraPosition({
        x: event.position.x,
        y: event.position.y,
        z: event.position.z
    }, lookat)
}


/**
 * Controller for the node coloring. Depending on which colorIndex this function receives, 
 * it will color the node by a different scale. 
 * @param {String} colorIndex The type of coloring to apply to the nodes
 */
function colorNodeBy(colorIndex, graphs) {
    //show the scale if hidden
    showScale();
    switch (colorIndex) {
        case 'degree':
            colorByDegree();
            generateScaleNumbers(cy.maxDegree);
            break
        case 'strength':
            colorByStrength();
            generateScaleNumbers(cy.maxStrength);
            break;
        case 'degree_centrality':
            colorByDegreeCentrality();
            generateScaleNumbers(cy.maxDegreeCentrality);
            break;
        case 'betweenness_centrality':
            colorByBetweennessCentrality();
            generateScaleNumbers(cy.maxBetweennessCentrality);
            break;
        default:
            colorByBase();
            hideScale();
    }

    //update graphs colors
    updateGraph(graphs);
}

/**
 * Colors the nodes based on their total degree. 
 */
function colorByDegree() {
    let nodes = cy.nodes();

    if (!cy.maxDegree) {
        let maxDegree = 0;
        for (i = 0; i < nodes.length; i++) {
            let degree = nodes[i].degree();
            nodes[i].data().nodeLink.degree = degree !== 0 ? degree : 1;

            if (degree > maxDegree) {
                maxDegree = degree;
            }
        }
        cy.maxDegree = maxDegree;

        for (i = 0; i < nodes.length; i++) {
            let degree = nodes[i].data().nodeLink.degree;
            let color = getColor((degree / cy.maxDegree) * 100)
            nodes[i].data().nodeLink.scaledColor.degree = color;
        }
    }
    for (i = 0; i < nodes.length; i++) {
        let graphNode = nodes[i].data().nodeLink;
        graphNode.color = graphNode.scaledColor.degree;
    }
}

/**
 * color nodes by total strength. Strength is defined as the total sum of their adjacent 
 * edge weights. (Opsahl)
 */
function colorByStrength() {
    let nodes = cy.nodes();
    if (!cy.maxStrength) {
        let maxStrength = 0;
        for (i = 0; i < nodes.length; i++) {
            let adjacent = nodes[i].neighborhood();
            let total = adjacent.reduce((acc, elem) => {
                if (elem.isEdge()) {
                    return acc + elem.data().weight;
                }
                return acc;
            }, 0)

            nodes[i].data().nodeLink.strength = total !== 0 ? total : .01;
            if (total > maxStrength) {
                maxStrength = total;
            }
        }
        cy.maxStrength = maxStrength;

        for (i = 0; i < nodes.length; i++) {
            let strength = nodes[i].data().nodeLink.strength;
            let color = getColor((strength / cy.maxStrength) * 100)
            nodes[i].data().nodeLink.scaledColor.strength = color;
        }
    }
    for (i = 0; i < nodes.length; i++) {
        let graphNode = nodes[i].data().nodeLink;
        graphNode.color = graphNode.scaledColor.strength;
    }
}

/**
 * Color node based on weighted degree centrality. 
 */
function colorByDegreeCentrality() {
    let nodes = cy.nodes();
    if (!cy.maxDegreeCentrality) {
        let maxDegreeCentrality = 0;
        let centralaityConfig = {
            root: undefined,
            weight: edge => {
                return edge.data().weight;
            }
        }
        for (i = 0; i < nodes.length; i++) {
            let root = nodes[i];
            centralaityConfig.root = root;
            let degreeCen = cy.$().degreeCentrality(centralaityConfig).degree;

            nodes[i].data().nodeLink.degreeCentrality = degreeCen;
            if (degreeCen > maxDegreeCentrality) {
                maxDegreeCentrality = degreeCen;
            }
        }
        cy.maxDegreeCentrality = maxDegreeCentrality;

        for (i = 0; i < nodes.length; i++) {
            let degreeCen = nodes[i].data().nodeLink.degreeCentrality;
            let color = getColor((degreeCen / cy.maxDegreeCentrality) * 100)
            nodes[i].data().nodeLink.scaledColor.degreeCentrality = color;
        }
    }
    for (i = 0; i < nodes.length; i++) {
        let graphNode = nodes[i].data().nodeLink;
        graphNode.color = graphNode.scaledColor.degreeCentrality
    }
}

/**
 * color node based on betweenness centrality
 */
function colorByBetweennessCentrality(){
    let nodes = cy.nodes();
    if (!cy.maxBetweennessCentrality) {

        let maxBetweennessCentrality = 0;
        let bc = cy.$().betweennessCentrality();

        for (i = 0; i < nodes.length; i++) {
            let root = nodes[i];
            let betweennessCen = bc.betweenness(root);

            nodes[i].data().nodeLink.betweennessCentrality = betweennessCen;
            if (betweennessCen > maxBetweennessCentrality) {
                maxBetweennessCentrality = betweennessCen;
            }
        }
        cy.maxBetweennessCentrality = maxBetweennessCentrality;

        for (i = 0; i < nodes.length; i++) {
            let betweenCen = nodes[i].data().nodeLink.betweennessCentrality;
            let color = getColor((betweenCen / cy.maxBetweennessCentrality) * 100)
            nodes[i].data().nodeLink.scaledColor.betweennessCentrality = color;
        }
    }
    for (i = 0; i < nodes.length; i++) {
        let graphNode = nodes[i].data().nodeLink;
        graphNode.color = graphNode.scaledColor.betweennessCentrality;
    }
}

/**
 * Color all nodes the base color, removing all scaling. 
 */
function colorByBase(){
    let cyNodes = cy.nodes();
    let cyEdges = cy.edges();

    new Promise((resolve, reject) => {
        for (i = 0; i < cyNodes.length; i++) {
            cyNodes[i].data().nodeLink.color = BASE_NODE_COLOR;
        }
    })
    new Promise((resolve, reject) => {
        for (i = 0; i < cyEdges.length; i++) {
            cyEdges[i].data().edgeLink.color = BASE_EDGE_COLOR;
        }
    })
}

//Gets the color from te generated color array. 
function getColor(ratio) {
    let percent = Math.round(ratio);
    percent = percent !== 0 ? percent : 1;
    return colorScale[percent - 1];
}